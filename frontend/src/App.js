import React from "react";
import "./index.css";
import Home from "./routes/Home";
import AboutUs from "./routes/AboutUs";
import Resize from "./routes/Resize";
import OurApp from "./routes/OurApp";

import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/resize" element={<Resize />} />
        <Route path="/our-app" element={<OurApp />} />
      </Routes>
    </div>
  );
}

export default App;
