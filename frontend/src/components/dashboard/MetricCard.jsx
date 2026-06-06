import React from 'react';

export const MetricCard = ({ title, value, unit, maxValue, icon: Icon, color = 'var(--accent-primary)' }) => {
  const percentage = maxValue ? Math.min((value / maxValue) * 100, 100) : null;

  return (
    <div className="glass-card fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
          {title}
        </h4>
        {Icon && (
          <div style={{ color, opacity: 0.8 }}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: percentage !== null ? '12px' : 0 }}>
        <span className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </span>
        {unit && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{unit}</span>}
      </div>
      {percentage !== null && (
        <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            borderRadius: '3px',
            background: color,
            transition: 'width 1s ease'
          }} />
        </div>
      )}
    </div>
  );
};
