import React from 'react';
import { Button } from '../common/Button';
import { AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import './FaultDetection.css';

export const ResultCard = ({ result, onRaiseRequest }) => {
  if (!result) return null;

  const isNormal = result.problem_class === 'Normal';
  const score = parseFloat(result.confidence_score);
  
  // Determine colors based on status
  let themeColor = isNormal ? 'var(--accent-emerald)' : 'var(--accent-red)';
  let glowClass = isNormal ? 'glow-border-emerald' : 'glow-border-red';
  let Icon = isNormal ? CheckCircle : AlertTriangle;

  return (
    <div className={`glass-card result-card fade-in ${glowClass}`}>
      <h3 className="form-title" style={{ textAlign: 'center', marginBottom: '24px' }}>Diagnostic Results</h3>
      
      <div className="gauge-container">
        {/* Simple SVG Donut Gauge */}
        <svg viewBox="0 0 100 100" className="confidence-gauge">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--bg-primary)" strokeWidth="10" />
          <circle 
            cx="50" cy="50" r="40" 
            fill="transparent" 
            stroke={themeColor} 
            strokeWidth="10" 
            strokeDasharray={`${score * 2.51} 251.2`} 
            strokeDashoffset="0"
            transform="rotate(-90 50 50)"
            className="gauge-progress"
          />
          <text x="50" y="45" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">CONFIDENCE</text>
          <text x="50" y="65" textAnchor="middle" fill="var(--text-primary)" fontSize="20" fontWeight="bold" className="mono">{result.confidence_score}%</text>
        </svg>
      </div>

      <div className="result-details">
        <div className="detail-row">
          <span className="detail-label">DETECTED STATUS</span>
          <div className="status-badge" style={{ backgroundColor: `${themeColor}22`, color: themeColor, border: `1px solid ${themeColor}` }}>
            <Icon size={14} />
            {result.problem_class.toUpperCase()}
          </div>
        </div>
        
        {!isNormal && score >= 90 && (
          <div className="auto-propagation-alert pulse">
            <Flame size={16} />
            <span>CRITICAL: Faulty count auto-incremented globally.</span>
          </div>
        )}
      </div>

      {!isNormal && (
        <Button 
          variant="warning" 
          size="lg" 
          className="w-full mt-4" 
          onClick={() => onRaiseRequest(result)}
        >
          <AlertTriangle size={20} />
          Raise Request
        </Button>
      )}
    </div>
  );
};
