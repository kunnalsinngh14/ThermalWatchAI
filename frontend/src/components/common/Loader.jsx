import React from 'react';
import './Common.css';

export const Loader = ({ fullScreen = false }) => {
  const content = (
    <div className="loader-ring pulse"></div>
  );

  if (fullScreen) {
    return (
      <div className="loader-fullscreen">
        {content}
      </div>
    );
  }

  return content;
};
