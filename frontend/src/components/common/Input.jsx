import React from 'react';
import './Common.css';

export const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label htmlFor={props.id || props.name} className="input-label">{label}</label>}
      <input 
        id={props.id || props.name}
        className={`input-field ${error ? 'input-error' : ''}`}
        {...props} 
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};
