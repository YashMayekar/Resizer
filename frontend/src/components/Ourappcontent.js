import React from "react";
import "../components/Ourappcontent.css";
import camimage from '../assets/Designer (1).png';


const Ourappcontent = () => {
  return (
    <div className="startcardapp">
        <div className="contentapp">
            <h1>Effortless Media Resizing with Our App</h1>
            <p>Our app offers a hassle free solution for resizing a variety of media files including images, videos, and GIFs. With a user friendly interface, users can easily upload their files, specify the desired percentage for resizing and choose between upscaling or downscaling options. Powered by Flask on the backend and React on the frontend, our app ensures efficient processing and dynamic interaction. Whether you need to compress large images, expand small videos, or optimize GIFs, our app provides a seamless experience for all your media resizing needs.</p>
        </div>

        <div className="right"> 
              <img src={camimage} className="image" alt="true"/>
        </div>
      
    </div>
  )
}

export default Ourappcontent
