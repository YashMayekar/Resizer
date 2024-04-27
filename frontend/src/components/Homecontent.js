// Homecontent.js

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../components/Homecontent.css';
import camimage from '../assets/cam.jpg';

const Homecontent = () => {
  const [typewriterText, setTypewriterText] = useState('');
  const text = "Efficiently Resize Your Images & Video";

  useEffect(() => {
    // Smooth scroll down on component mount
    window.scrollBy({
      top: 150, // Adjust the value as needed
      behavior: 'smooth' // Enable smooth scrolling
    });
  }, []);


  useEffect(() => {
    let charIndex = 0;
    const typeTimer = setInterval(() => {
      if (charIndex <= text.length) {
        setTypewriterText(text.substring(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeTimer);
      }
    }, 80); // Adjust typing speed as needed

    return () => clearInterval(typeTimer);
  }, []);

  useEffect(() => {
    // Smooth scroll down on component mount
    window.scrollBy({
      top: 115, // Adjust the value as needed
      behavior: 'smooth' // Enable smooth scrolling
    });
  }, []);


  return (
    <div className="home">
      <div className="startcard">
        <div className="left"> 
          <div className="content">
            <button className="topbtn">#easy-resize</button>
            <h1>{typewriterText}</h1>
            <p>Welcome to our innovative online platform designed to streamline the process of resizing both images and videos effortlessly. Our user-friendly website offers a seamless solution for adjusting the dimensions of your media files without compromising quality.</p>
            <Link to="/resize">
              <button className="btn">Start Resizing</button>
            </Link>
          </div>
        </div>
        <div className="right"> 
          <div className="img-container">
            <div className="img-stack">
              <img src={camimage} className="img" alt="true"/>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
};

export default Homecontent;
