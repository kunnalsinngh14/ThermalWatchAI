import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const GaugeChart = ({ title, value, maxValue = 100, unit = '%', color = 'var(--accent-emerald)' }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const data = [
    { name: 'value', value: percentage },
    { name: 'empty', value: 100 - percentage }
  ];

  return (
    <div className="glass-card fade-in" style={{ padding: '20px', textAlign: 'center' }}>
      <h4 style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>
        {title}
      </h4>
      <div style={{ width: '100%', height: '160px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="75%"
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="90%"
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="rgba(255,255,255,0.05)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <span className="mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>{unit}</span>
        </div>
      </div>
    </div>
  );
};
