import React from "react";
import "../components/Ourappcontent.css";
import camimage from '../assets/Designer (1).png';

const Ourappcontent = () => {
  return (
    <div className="startcardapp">
      <div className="left-content">
        <h1>Effortless Media Resizing</h1>
        <p>
          Our application provides a seamless solution for resizing and 
          upscaling a variety of media files — including <b>images</b>, 
          <b>GIFs</b>, and <b>videos</b>. With a clean and intuitive interface, 
          you can upload your file, choose the resize percentage, and select 
          whether to <b>upscale</b> or <b>downscale</b>.
        </p>
        <p>
          Powered by <b>FastAPI</b> on the backend and <b>React</b> on the frontend, 
          the app ensures fast processing and smooth interaction. 
          Advanced features like <b>FSRCNN Super-Resolution</b> deliver 
          high-quality results for sharper images and videos.
        </p>
        <p>
          Whether you need to compress large images, optimize GIFs for the web, 
          or upscale low-resolution videos, our app makes it effortless. 
          Track progress in real-time and download your processed media instantly.
        </p>
      </div>

      <div className="right-content">
        <img src={camimage} className="image" alt="App demo" />
      </div>
    </div>
  );
};

export default Ourappcontent;
