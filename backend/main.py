from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageSequence
import cv2 as cv
import numpy as np
import io
import os
import shutil
import tempfile
import logging
from cv2 import dnn_superres
from typing import Dict
import uuid
from datetime import datetime

# ---------------------------------------------------------
# FastAPI Initialization
# ---------------------------------------------------------
app = FastAPI(
    title="Media Resizer API",
    description="Resize images, GIFs, and videos with FSRCNN upscaling + task & progress tracking",
)

logging.basicConfig(level=logging.INFO)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return {
        "message": "Hello from FastAPI!!!",
        "datetime": current_time
    }

# ---------------------------------------------------------
# Global task store
# ---------------------------------------------------------
progress_store: Dict[str, int] = {}
status_store: Dict[str, str] = {}   # processing | completed | failed
result_store: Dict[str, str] = {}   # file paths for completed tasks

# ---------------------------------------------------------
# Load FSRCNN Super-Resolution Model (×4)
# ---------------------------------------------------------
fsrcnn = dnn_superres.DnnSuperResImpl_create()
try:
    fsrcnn.readModel("models/FSRCNN_x4.pb")
    fsrcnn.setModel("fsrcnn", 4)
except Exception:
    logging.warning("FSRCNN model not loaded. Upscaling will fail.")
    fsrcnn = None


def upscale_with_fsrcnn(img: np.ndarray) -> np.ndarray:
    if fsrcnn is None:
        raise Exception("FSRCNN model not available")
    if len(img.shape) == 2:
        img = cv.cvtColor(img, cv.COLOR_GRAY2BGR)
    elif img.shape[2] == 4:
        img = cv.cvtColor(img, cv.COLOR_BGRA2BGR)
    return fsrcnn.upsample(img)


# ---------------------------------------------------------
# Upload + Start Task
# ---------------------------------------------------------
@app.post("/resize")
async def resize_media(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    percentage: int = Form(...),
    upscale: bool = Form(...),
):
    """
    Start resize job → returns task_id immediately.
    User checks /resize/{task_id}/progress and /resize/{task_id}/result.
    """
    task_id = str(uuid.uuid4())
    progress_store[task_id] = 0
    status_store[task_id] = "processing"

    filename = file.filename
    ext = filename.split(".")[-1].lower()
    interpolation = cv.INTER_CUBIC if upscale else cv.INTER_AREA
    scale_percent = (100 + percentage) if upscale else max(percentage, 1)

    # temp working directory for this task
    task_dir = tempfile.mkdtemp(prefix=f"task_{task_id}_")
    input_path = os.path.join(task_dir, f"input.{ext}")
    with open(input_path, "wb") as f:
        f.write(await file.read())

    # schedule background task
    background_tasks.add_task(
        process_file, task_id, input_path, ext, scale_percent, interpolation, upscale
    )

    return {"task_id": task_id, "status": "processing"}


# ---------------------------------------------------------
# Background Processing
# ---------------------------------------------------------
def process_file(task_id, input_path, ext, percentage, interpolation, upscale):
    try:
        if ext in ("jpeg", "jpg", "png"):
            output_path = resize_image(input_path, percentage, interpolation, upscale, task_id, ext)
        elif ext == "gif":
            output_path = resize_gif(input_path, percentage, interpolation, upscale, task_id)
        elif ext in ("mp4", "mov", "avi", "mkv", "3gp"):
            output_path = resize_video(input_path, percentage, interpolation, upscale, task_id, ext)
        else:
            raise Exception("Unsupported file format")

        result_store[task_id] = output_path
        status_store[task_id] = "completed"
        progress_store[task_id] = 100
        logging.info(f"Task {task_id} completed")

    except Exception as e:
        logging.exception(f"Task {task_id} failed")
        status_store[task_id] = "failed"
        progress_store[task_id] = 0


# ---------------------------------------------------------
# Image Resizing
# ---------------------------------------------------------
def resize_image(path, percentage, interpolation, upscale, task_id, ext):
    img = cv.imread(path, cv.IMREAD_UNCHANGED)
    if img is None:
        raise Exception("Could not read image")

    progress_store[task_id] = 30
    if upscale:
        img = upscale_with_fsrcnn(img)

    progress_store[task_id] = 60
    new_size = (int(img.shape[1] * percentage / 100), int(img.shape[0] * percentage / 100))
    img = cv.resize(img, new_size, interpolation=interpolation)

    output_path = path.replace("input", "output")
    cv.imwrite(output_path, img)
    progress_store[task_id] = 90
    return output_path


# ---------------------------------------------------------
# Video Resizing
# ---------------------------------------------------------
def resize_video(path, percentage, interpolation, upscale, task_id, ext):
    output_path = path.replace("input", "output")

    cap = cv.VideoCapture(path)
    if not cap.isOpened():
        raise Exception("Failed to open video file")

    fps = cap.get(cv.CAP_PROP_FPS)
    width = int(cap.get(cv.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv.CAP_PROP_FRAME_COUNT))

    new_width = int(width * percentage / 100)
    new_height = int(height * percentage / 100)

    fourcc = cv.VideoWriter_fourcc(*'mp4v')
    out = cv.VideoWriter(output_path, fourcc, fps, (new_width, new_height))

    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if upscale:
            frame = upscale_with_fsrcnn(frame)
        frame = cv.resize(frame, (new_width, new_height), interpolation=interpolation)
        out.write(frame)

        frame_count += 1
        progress_store[task_id] = int((frame_count / total_frames) * 100)

    cap.release()
    out.release()
    return output_path


# ---------------------------------------------------------
# GIF Resizing
# ---------------------------------------------------------
def resize_gif(path, percentage, interpolation, upscale, task_id):
    output_path = path.replace("input", "output")

    img = Image.open(path)
    frames = list(ImageSequence.Iterator(img))
    total_frames = len(frames)

    processed_frames = []
    for i, frame in enumerate(frames):
        frame = frame.convert("RGBA")
        frame_np = cv.cvtColor(np.array(frame), cv.COLOR_RGBA2BGRA)

        if upscale:
            frame_np = upscale_with_fsrcnn(frame_np)

        new_size = (int(frame_np.shape[1] * percentage / 100), int(frame_np.shape[0] * percentage / 100))
        resized = cv.resize(frame_np, new_size, interpolation=interpolation)
        frame_pil = Image.fromarray(cv.cvtColor(resized, cv.COLOR_BGRA2RGBA))
        processed_frames.append(frame_pil)

        progress_store[task_id] = int(((i + 1) / total_frames) * 100)

    processed_frames[0].save(
        output_path,
        save_all=True,
        append_images=processed_frames[1:],
        loop=0,
        format="GIF",
    )
    return output_path


# ---------------------------------------------------------
# Progress Endpoint
# ---------------------------------------------------------
@app.get("/resize/{task_id}/progress")
async def get_progress(task_id: str):
    if task_id not in progress_store:
        raise HTTPException(status_code=404, detail="Task ID not found")
    return {
        "task_id": task_id,
        "status": status_store.get(task_id, "unknown"),
        "progress": progress_store[task_id],
    }


# ---------------------------------------------------------
# Result Endpoint
# ---------------------------------------------------------
@app.get("/resize/{task_id}/result")
async def get_result(task_id: str):
    if status_store.get(task_id) != "completed":
        raise HTTPException(status_code=400, detail="Task not completed yet")
    output_path = result_store.get(task_id)
    if not output_path or not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Result file not found")

    ext = output_path.split(".")[-1].lower()
    mime = "application/octet-stream"
    if ext in ("jpg", "jpeg", "png"):
        mime = f"image/{ext}"
    elif ext == "gif":
        mime = "image/gif"
    elif ext in ("mp4", "mov", "avi", "mkv", "3gp"):
        mime = f"video/{ext}"

    return StreamingResponse(open(output_path, "rb"), media_type=mime)
