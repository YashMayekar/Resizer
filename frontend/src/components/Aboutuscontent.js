import React from "react";
import "../components/Aboutuscontent.css";
import yashprofile from '../assets/yash.jpeg';


const Aboutuscontent = () => {
  return (
    <div className="team-members-container">
    <div className="member-card">
      <img src={yashprofile} alt="Member 1" className="member-photo" />
      <h2>Yash Mayekar</h2>
      <p>Role: Member 1</p>
    </div>
    <div className="member-card">
      <img src={yashprofile} alt="Member 2" className="member-photo" />
      <h2>Sainath Khot</h2>
      <p>Role: Member 2</p>
    </div>
    <div className="member-card">
      <img src={yashprofile} alt="Member 3" className="member-photo" />
      <h2>Kiran Dhuri</h2>
      <p>Role: Member 3</p>
    </div>
  </div>
  )
}

export default Aboutuscontent
