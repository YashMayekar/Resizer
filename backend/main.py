from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageSequence
import cv2 as cv
import numpy as np
import os
import tempfile
import logging
from typing import Dict
import uuid
from datetime import datetime

# ---------------------------------------------------------
# FastAPI Initialization
# ---------------------------------------------------------
app = FastAPI(
    title="Media Resizer API",
    description="Resize images, GIFs, and videos (upscale/downscale) with progress tracking",
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
    return {
        "message": "Hello from FastAPI!",
        "datetime": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

# ---------------------------------------------------------
# Global task store
# ---------------------------------------------------------
progress_store: Dict[str, int] = {}
status_store: Dict[str, str] = {}  
result_store: Dict[str, str] = {}


# ---------------------------------------------------------
# PURE OPENCV UPSCALE & DOWNSCALE (NO FSRCNN)
# ---------------------------------------------------------
def pure_upscale(img: np.ndarray, percentage: int, interpolation=cv.INTER_CUBIC):
    """Upscale image using OpenCV only."""
    scale = (100 + percentage) / 100.0
    new_size = (int(img.shape[1] * scale), int(img.shape[0] * scale))
    logging.info(f"Upscaling with scale={scale}, new_size={new_size}")
    return cv.resize(img, new_size, interpolation=interpolation)

def pure_resize(img: np.ndarray, percentage: int, interpolation=cv.INTER_AREA):
    """Downscale image with OpenCV."""
    new_size = (int(img.shape[1] * percentage / 100), int(img.shape[0] * percentage / 100))
    logging.info(f"Resizing with percentage={percentage}%, new_size={new_size}")
    return cv.resize(img, new_size, interpolation=interpolation)


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

    task_id = str(uuid.uuid4())
    progress_store[task_id] = 0
    status_store[task_id] = "processing"

    logging.info(f"[{task_id}] Received file: {file.filename}")
    logging.info(f"[{task_id}] upscale={upscale}, percentage={percentage}")

    ext = file.filename.split(".")[-1].lower()

    # Select interpolation
    interpolation = cv.INTER_CUBIC if upscale else cv.INTER_AREA

    # Create temp folder for task
    task_dir = tempfile.mkdtemp(prefix=f"task_{task_id}_")
    input_path = os.path.join(task_dir, f"input.{ext}")

    with open(input_path, "wb") as f:
        f.write(await file.read())

    logging.info(f"[{task_id}] Saved input file to {input_path}")

    # Add background task
    background_tasks.add_task(
        process_file, task_id, input_path, ext, percentage, interpolation, upscale
    )

    return {"task_id": task_id, "status": "processing"}


# ---------------------------------------------------------
# Background Processing
# ---------------------------------------------------------
def process_file(task_id, input_path, ext, percentage, interpolation, upscale):
    logging.info(f"[{task_id}] Starting background processing...")

    try:
        if ext in ("jpeg", "jpg", "png"):
            output_path = resize_image(input_path, percentage, interpolation, upscale, task_id)
        elif ext == "gif":
            output_path = resize_gif(input_path, percentage, interpolation, upscale, task_id)
        elif ext in ("mp4", "mov", "avi", "mkv", "3gp"):
            output_path = resize_video(input_path, percentage, interpolation, upscale, task_id)
        else:
            raise Exception("Unsupported file format")

        result_store[task_id] = output_path
        status_store[task_id] = "completed"
        progress_store[task_id] = 100

        logging.info(f"[{task_id}] Processing complete. Output: {output_path}")

    except Exception as e:
        logging.exception(f"[{task_id}] Processing failed: {e}")
        status_store[task_id] = "failed"
        progress_store[task_id] = 0


# ---------------------------------------------------------
# IMAGE Resizing
# ---------------------------------------------------------
def resize_image(path, percentage, interpolation, upscale, task_id):
    logging.info(f"[{task_id}] Reading image...")

    img = cv.imread(path, cv.IMREAD_UNCHANGED)
    if img is None:
        raise Exception("Could not read image file")

    progress_store[task_id] = 20

    if upscale:
        logging.info(f"[{task_id}] Performing upscale...")
        img = pure_upscale(img, percentage, interpolation)
    else:
        logging.info(f"[{task_id}] Performing downscale...")
        img = pure_resize(img, percentage, interpolation)

    progress_store[task_id] = 80

    output_path = path.replace("input", "output")
    cv.imwrite(output_path, img)

    logging.info(f"[{task_id}] Image written to {output_path}")

    return output_path


# ---------------------------------------------------------
# VIDEO Resizing
# ---------------------------------------------------------
def resize_video(path, percentage, interpolation, upscale, task_id):
    logging.info(f"[{task_id}] Opening video...")

    output_path = path.replace("input", "output")
    cap = cv.VideoCapture(path)

    if not cap.isOpened():
        raise Exception("Error opening video file")

    fps = cap.get(cv.CAP_PROP_FPS)
    width = int(cap.get(cv.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv.CAP_PROP_FRAME_COUNT))

    if upscale:
        scale = (100 + percentage) / 100
    else:
        scale = percentage / 100

    new_size = (int(width * scale), int(height * scale))

    logging.info(f"[{task_id}] New video size: {new_size}")

    fourcc = cv.VideoWriter_fourcc(*'mp4v')
    out = cv.VideoWriter(output_path, fourcc, fps, new_size)

    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv.resize(frame, new_size, interpolation=interpolation)
        out.write(frame)

        frame_count += 1
        progress_store[task_id] = int((frame_count / total) * 100)

    cap.release()
    out.release()

    logging.info(f"[{task_id}] Video written to {output_path}")

    return output_path


# ---------------------------------------------------------
# GIF Resizing
# ---------------------------------------------------------
def resize_gif(path, percentage, interpolation, upscale, task_id):
    logging.info(f"[{task_id}] Processing GIF...")

    output_path = path.replace("input", "output")
    img = Image.open(path)

    frames = list(ImageSequence.Iterator(img))
    total_frames = len(frames)

    processed = []
    scale = (100 + percentage) / 100 if upscale else percentage / 100

    for i, frame in enumerate(frames):
        frame = frame.convert("RGBA")
        frame_np = np.array(frame)

        new_size = (int(frame_np.shape[1] * scale), int(frame_np.shape[0] * scale))
        resized = cv.resize(frame_np, new_size, interpolation=interpolation)
        processed.append(Image.fromarray(resized))

        progress_store[task_id] = int(((i + 1) / total_frames) * 100)

    processed[0].save(output_path, save_all=True, append_images=processed[1:], loop=0)

    logging.info(f"[{task_id}] GIF written to {output_path}")

    return output_path


# ---------------------------------------------------------
# Progress Endpoint
# ---------------------------------------------------------
@app.get("/resize/{task_id}/progress")
def get_progress(task_id: str):
    if task_id not in progress_store:
        raise HTTPException(status_code=404, detail="Task ID not found")

    return {
        "task_id": task_id,
        "status": status_store.get(task_id, "unknown"),
        "progress": progress_store[task_id]
    }


# ---------------------------------------------------------
# Result Endpoint
# ---------------------------------------------------------
@app.get("/resize/{task_id}/result")
def get_result(task_id: str):
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

    logging.info(f"[{task_id}] Sending file to client: {output_path}")

    return StreamingResponse(open(output_path, "rb"), media_type=mime)
