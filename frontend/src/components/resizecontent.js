import "../components/resizecontent.css";
import { useState } from 'react'
import React from 'react';
import axios from "axios";

const Resizecontent = () => {
    const [file ,setfile] = useState(null);
    const [percentage ,setper] = useState(null);
    const [upscale, setup] = useState(false);
    const [downscale, setdown] = useState(false);
    const [isLoading, setLoad] = useState(false);
    const [isresized, setisrez] = useState(false)
  
    const Upscale = () => {
      setup(!upscale);
      setdown(false);
    }
  
    const Downscale = () => {
      setup(false);
      setdown(!downscale);
    }

    const resize = async () => {
      if (file === null) {alert("Please Enter the file"); return}
      if (percentage === 0) {alert("Please Enter the percentage"); return}
      if ( (upscale === false) && (downscale === false) ) {alert("Please select whether to Upscale or downscale"); return} 
      const formData = new FormData();
      formData.append('file', file);
      formData.append('percentage', percentage);
      formData.append('upscale', upscale ? 'true' : 'false'); // Send as string
      formData.append('downscale', downscale ? 'true' : 'false'); // Add downscale option
      setLoad(true)
      try {
          const response = await axios.post('http://localhost:5000/resize', formData, {
              headers: {
                  'Content-Type': 'multipart/form-data',
                  'Access-Control-Allow-Origin': '*'
              },
              responseType: 'blob', // Receive response as a binary blob
          });

          // Create a download link for the resized file
          const downloadUrl = window.URL.createObjectURL(new Blob([response.data], { type: file.type }));
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', "resized_"+(upscale ? "Upscaled_" : "Downscaled_")+file.name);
          setisrez(true)
          document.body.appendChild(link);
          link.click();
  
      } catch (error) {
          console.error('Error resizing file:', error);
      }
  }

  return (
    <div>
    <div className="resizecard" >
    <div className="showfile">
    {file && (
    <div>
        {file.type.startsWith('image') ? (
            // If the file is an image, display it
            <img src={URL.createObjectURL(file)} alt="Preview" style={{ maxWidth: '550px' ,maxHeight: '450px'}} />
        ) : (
            // If the file is a video, display it
            <video key={file.name} controls style={{ maxWidth:'550px' , maxHeight:'480px' }}>
                <source src={URL.createObjectURL(file)} type={file.type} />
                Your browser does not support the video tag.
            </video>
        )}
    </div>
)}  
</div>

      <div className="input">
        <div className="fileinput">
          Enter Your File
          <br />
          <input className='fileinputbox' type="file" accept="image/video/*" alt='' onChange={(e) => {setfile(e.target.files[0]), setLoad(false), setisrez(false)}}></input>
        </div>
        
        <div className="scallingtoggle">
          UpScale or DownScale your file.
            <br/>
            <p >UpScale to expand & DownScale to compress your file </p>
          <div className='scallingswitchbox'>
          <div className="upscale">
            UpScale
          <label class="switch" >
            <input type="checkbox" checked={upscale} onChange={() => {Upscale(), setLoad(false), setisrez(false)}} />
            <span class="slider round"></span>
          </label>
          </div>          
          <div className="downscale">
            DownScale
          <label class="switch">
            <input type="checkbox" checked={downscale} onChange={() => {Downscale(), setLoad(false), setisrez(false)}}/>
            <span class="slider round"></span>
          </label>
          </div>
        </div>
        </div>
        <div className="percentageinput">
          Percentage ( 1 ~ 100% )
          <br />
          <input className='percentageinputbox' type="number" min={1} max={200} onChange={ (e) => {setper(e.target.value), setLoad(false), setisrez(false)}}></input>
        </div>
        
        <button className="resize" onClick={resize}>
          {isLoading ? (
          isresized ? "File Resized" : (
          <span>Loading<span className="loading-dots">.</span><span className="loading-dots">.</span><span className="loading-dots">.</span></span>
                        )
                       ) : "Resize"}
        </button>


        {/* <button className="resize" onClick={resize}> {isLoading ? (isresized ? "File Resized" : "Loading...") : "Resize"} </button> */}
        <a id="downloadLink" download="#" href="#" style={{display : 'none', margin: '20px auto 0 auto'}}>Download Resized Video</a>
      </div>
    </div>
    </div>
  );
};

export default Resizecontent;