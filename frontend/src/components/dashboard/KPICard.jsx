import React, { useEffect, useState } from 'react';
import './KPICard.css';

export const KPICard = ({ title, value, icon: Icon, colorClass }) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Simple count up animation
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (end === 0) {
      setDisplayValue(value);
      return;
    }
    
    const duration = 1000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(value); // Set exact final value (might be string with commas)
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className={`kpi-card glass-card fade-in ${colorClass}`}>
      <div className="kpi-header">
        <h4 className="kpi-title">{title}</h4>
        <div className={`kpi-icon-wrapper text-${colorClass.split('-').pop()}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="kpi-value mono">{displayValue}</div>
    </div>
  );
};
