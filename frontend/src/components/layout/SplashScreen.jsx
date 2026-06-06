import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = () => {
  return (
    <div className="splash-overlay">
      <div className="splash-panel splash-panel-left"></div>
      <div className="splash-panel splash-panel-right"></div>
      <div className="splash-text-container">
        <h1 className="splash-text">
          ThermalWatchAI
        </h1>
      </div>
    </div>
  );
};

export default SplashScreen;
