import React from 'react';
import { X } from 'lucide-react';
import './Common.css';

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop fade-in">
      <div className="modal-content glass-card fade-in">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};
