import React from 'react';
import './Requests.css';

export const SortDropdown = ({ value, onChange }) => {
  return (
    <div className="sort-dropdown-container">
      <span className="sort-label">Sort By:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="sort-select">
        <option value="time_desc">Newest First</option>
        <option value="time_asc">Oldest First</option>
        <option value="priority_desc">Priority (High to Low)</option>
      </select>
    </div>
  );
};
