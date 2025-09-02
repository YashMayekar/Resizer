import React from "react";
import "../components/Aboutuscontent.css";
import yashprofile from '../assets/yash_photo.jpeg';
import sainathprofile from '../assets/sainath_photo.jpeg';

// import sainathprofile from '../assets/sainath.jpeg'; // make sure you add Sainath's photo in assets

const Aboutuscontent = () => {
  return (
    <div className="about-container">
      <h1 className="about-title">👨‍💻 Meet the Creators</h1>
      <p className="about-subtitle">
        Passionate engineers crafting seamless media resizing experiences with <b>AI</b> and <b>modern web technologies</b>.
      </p>

      <div className="team-members-container">
        {/* Yash */}
        <div className="member-card">
          <img src={yashprofile} alt="Yash Mayekar" className="member-photo" />
          <h2 >
            <a href="https://www.linkedin.com/in/yashmayekar21/" target="_blank" rel="noopener noreferrer">
            Yash Mayekar
            </a>
          </h2>
          <p className="role">B.E. in Artificial Intelligence & Data Science</p>
          <p className="bio">
            A tech enthusiast who loves building AI-driven applications that
            solve real-world problems. Skilled in <b>machine learning</b>,
            <b> backend systems</b>, and <b>data processing pipelines</b>.
          </p>
        </div>

        {/* Sainath */}
        <div className="member-card">
          <img src={sainathprofile} alt="Sainath Khot" className="member-photo" />
          <h2 >
            <a href="https://www.linkedin.com/in/sainath-khot/" target="_blank" rel="noopener noreferrer">
            Sainath Khot
            </a>
          </h2>
          <p className="role">B.E. in Artificial Intelligence & Data Science</p>
          <p className="bio">
            Passionate about <b>software engineering</b> and <b>AI integration</b>.
            Focused on creating scalable, user-friendly applications that bring
            cutting-edge tech closer to everyday users.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Aboutuscontent;
