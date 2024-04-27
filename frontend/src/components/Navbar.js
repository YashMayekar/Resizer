import { Link } from "react-router-dom";
import './Navbar.css';

import { FaBars, FaTimes } from "react-icons/fa";
import React, { useState } from 'react';

const Navbar = () => {
    const [click, setClick] = useState(false);
    const handleClick = () => setClick(!click);

    return (
        <div className="header">
            <Link to="/">
                <h1>Resizer</h1>
            </Link>
            <div className={click ? "nav-menu active" : "nav-menu"}>
            {click ? (<FaTimes className="cross" size={20} style={{ color: "white" }} onClick={handleClick}/>) : null }
                <li>
                    <Link to="/">Home</Link>
                </li>
                <li>
                    <Link to="our-app">Our App</Link>
                </li>
                <li>
                    <Link to="/about">About Us</Link>
                </li>
                
            </div>
            <div className="hamburger" onClick={handleClick}>
                {click ? null : (<FaBars size={20} style={{ color: "white" }} />)}
            </div>
        </div>
    );
};

export default Navbar;
