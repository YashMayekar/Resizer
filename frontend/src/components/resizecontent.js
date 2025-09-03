import "../components/resizecontent.css";
import { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const API_BASE = process.env.REACT_APP_API_URL;

const Resizecontent = () => {
  const [file, setFile] = useState(null);
  const [percentage, setPer] = useState(null);
  const [upscale, setUp] = useState(false);
  const [downscale, setDown] = useState(false);
  const [isLoading, setLoad] = useState(false);
  const [isResized, setIsResized] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggleUpscale = () => {
    setUp(!upscale);
    setDown(false);
  };

  const toggleDownscale = () => {
    setUp(false);
    setDown(!downscale);
  };

  const resize = async () => {
    if (!file) {
      toast.warn("Please select a file");
      return;
    }
    if (!percentage || percentage <= 0) {
      toast.warn("Please enter a valid percentage");
      return;
    }
    if (!upscale && !downscale) {
      toast.warn("Please select Upscale or Downscale");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("percentage", percentage);
    formData.append("upscale", upscale ? "true" : "false");

    setLoad(true);
    setIsResized(false);
    setProgress(0);

    try {
      toast.warn(`${API_BASE}/resize`)
      // ✅ Start resize task
      const response = await axios.post(`${API_BASE}/resize`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { task_id } = response.data;
      if (!task_id) throw new Error("No task_id returned from backend");

      // ✅ Poll for progress
      pollProgress(task_id);
    } catch (err) {
      console.error("Error starting resize:", err);
      toast.error("Failed to start resize task.");
      setLoad(false);
    }
  };

  // ✅ Poll backend for progress
  const pollProgress = (taskId) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/resize/resize/${taskId}/progress`);
        const { progress, status } = res.data;

        setProgress(progress);

        if (status === "completed") {
          clearInterval(interval);
          fetchResult(taskId);
        } else if (status === "failed") {
          clearInterval(interval);
          toast.error("Resizing failed. Check backend logs.");
          setLoad(false);
        }
      } catch (err) {
        clearInterval(interval);
        console.error("Error polling progress:", err);
        toast.error("Lost connection while tracking progress.");
        setLoad(false);
      }
    }, 1000);
  };

  // ✅ Fetch result file when completed
  const fetchResult = async (taskId) => {
    try {
      const res = await axios.get(`${API_BASE}/resize/resize/${taskId}/result`, {
        responseType: "blob",
      });

      handleDownload(res.data, file);
      setIsResized(true);
      setLoad(false);
      toast.success("File resized successfully!");
    } catch (err) {
      console.error("Error fetching result:", err);
      toast.error("Could not fetch resized file.");
      setLoad(false);
    }
  };

  // ✅ Trigger file download
  const handleDownload = (blobData, file) => {
    const downloadUrl = window.URL.createObjectURL(blobData);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute(
      "download",
      "resized_" + (upscale ? "Upscaled_" : "Downscaled_") + file.name
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="resizecard">
        {/* Preview File */}
        <div className="showfile">
          {file && (
            <div>
              {file.type.startsWith("image") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  style={{ maxWidth: "100%", maxHeight: "65vh" }}
                />
              ) : (
                <video key={file.name} controls style={{ maxWidth: "100%", maxHeight: "65vh" }}>
                  <source src={URL.createObjectURL(file)} type={file.type} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
        </div>

        <div className="input">
          {/* File Upload */}
          <div className="form-section">
            <h3>Upload File</h3>
            <input
              className="fileinputbox"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                setFile(e.target.files[0]);
                setLoad(false);
                setIsResized(false);
                setProgress(0);
              }}
            />
          </div>

          {/* Scaling Options */}
          <div className="form-section">
            <h3>Scaling Options</h3>
            <div className="scallingswitchbox">
              <div className="toggle-item">
                <span>UpScale</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={upscale}
                    onChange={() => {
                      toggleUpscale();
                      setLoad(false);
                      setIsResized(false);
                      setProgress(0);
                    }}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="toggle-item">
                <span>DownScale</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={downscale}
                    onChange={() => {
                      toggleDownscale();
                      setLoad(false);
                      setIsResized(false);
                      setProgress(0);
                    }}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Percentage Input */}
          <div
            className="form-section"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <div>
              <h3>Resize Percentage</h3>
              <p className="section-desc">Enter a value between 1% - 100%.</p>
            </div>
            <input
              className="percentageinputbox"
              type="number"
              min={1}
              max={100}
              onChange={(e) => {
                setPer(e.target.value);
                setLoad(false);
                setIsResized(false);
                setProgress(0);
              }}
            />
          </div>

          {/* Action + Progress */}
          <div className="form-section action-section">
            <button className="resize" onClick={resize}>
              {isLoading ? (isResized ? "File Resized" : "Resizing...") : "Resize"}
            </button>

            {/* Progress Bar */}
            {isLoading && (
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}>
                  {progress}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Resizecontent;
