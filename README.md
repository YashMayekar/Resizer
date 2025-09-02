# 📦 RESIZER

A full-stack application to **resize and upscale images, GIFs, and videos** with progress tracking.  
Built using **FastAPI** (backend) and **React** (frontend).  

---

## 🚀 Features

- ✅ Supports **images (JPG/PNG)**, **animated GIFs**, and **videos (MP4/MOV/AVI/MKV/3GP)**  
- ✅ Uses **OpenCV** and **FSRCNN Super-Resolution** for high-quality upscaling  
- ✅ Tracks **task progress** in real time (`/resize/{task_id}/progress`)  
- ✅ Non-blocking background tasks (supports multiple users simultaneously)  
- ✅ React frontend with:
  - File preview (image/video)  
  - Upscale / Downscale toggle  
  - Percentage resize input  
  - Progress bar with live updates  
  - Automatic download on completion  

---

## 🏗️ System Architecture

```text
Frontend (React)  
↳ FastAPI Backend 
↳ Task Queue (BackgroundTasks)
↳ Image/GIF/Video Processing (OpenCV + PIL)
↳ Task Stores (progress/status/results)
```
Workflow
---
1. User uploads a file via frontend

2. Backend assigns a unique task_id (via uuid)

3. File is processed asynchronously in a background task

4. User polls for progress until the task is complete

5. User downloads the resized file from the backend

---
## ⚙️ Backend Implementation (FastAPI)
- **Endpoints:**  
1. `POST /resize`    
Start a new resize task. Returns:
```json
{
  "task_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing"
}
```
2. `GET /resize/{task_id}/progress`  
Returns current progress and status:
```json
{
  "task_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing",
  "progress": 65
}
```
3. `GET /resize/{task_id}/result`  
Returns the resized file (image/video/gif).


- **Processing Flow**  
  - **Images**: Loaded with OpenCV → resized → saved.  
  - **GIFs**: Frames extracted with Pillow → resized individually → re-assembled.  
  - **Videos**: Frames read with OpenCV → resized → written with cv2.VideoWriter.  
  - **Upscaling**: If enabled, uses FSRCNN x4 model (opencv_dnn_superres).

- **Task Management**  
  - **progress_store**: Track progress (%) of each task  
  - **status_store**: processing | completed | failed  
  - **result_store**: Path to processed output file

---
## 🎨 Frontend Implementation (React)
- **Key Features**  
  - File preview (image or video player)
  - Toggle between Upscale and Downscale
  - Resize percentage input (1–100%)
  - Progress bar updates based on backend polling
  - Automatic download when task completes

- **Flow**  
  - POST /resize with form data  
  - Poll /resize/{task_id}/progress every second  
  - Once complete, fetch file from /resize/{task_id}/result  
  - Trigger browser download

## 📚 Libraries Used
**Backend**
 - **FastAPI** – API framework
 - **OpenCV** (cv2) – image/video processing
 - **opencv_contrib** (dnn_superres) – FSRCNN super-resolution model
 - **Pillow** (PIL) – GIF frame handling
 - **uuid** – unique task IDs

**Frontend**
 - **React** – UI framework
 - **Axios** – HTTP client
 - **React Toastify** – notifications

## 🛠️ Installation
Backend
```bash
git clone https://github.com/yourusername/media-resizer.git
cd media-resizer/backend
pip install -r requirements.txt
```
## Run the server
```
uvicorn main:app --reload
```  

## Frontend  
  
```bash
cd ../frontend
npm install
npm start
```
## ⚠️ Known Limitations
**Video output does not include audio tracks**  
Currently, videos are re-encoded frame-by-frame using OpenCV, which does not handle audio.  
As a result, any original audio is lost.

## 🎯 Future Work: Integrate FFmpeg to merge processed video with original audio.

**No task cancellation**  
Long-running jobs (e.g., large videos) cannot be stopped once started.

## 🎯 Future Work: Add /resize/{task_id}/cancel endpoint.

**Temporary file cleanup**  
Processed files remain on disk until manually removed.

## 🎯 Future Work: Add automatic cleanup (e.g., after download or after X hours).

## 🔮 Future Deprecations & Improvements
  - Migrate from in-memory task stores (progress_store, status_store, etc.) → to a persistent database or Redis for scalability.
 - Replace FastAPI BackgroundTasks with Celery / RQ for distributed processing.
 - Add Docker support for easy deployment.
 - Implement WebSocket progress updates instead of polling.
 - Improve frontend UI/UX with drag-and-drop upload and cancel button.
 - Support batch file processing.

## 📄 License
MIT License – free to use and modify.

## 👨‍💻 Authors
**Yash Mayekar**   
**Sainath Khot**

Contributions welcome! Open a PR or create an issue.
