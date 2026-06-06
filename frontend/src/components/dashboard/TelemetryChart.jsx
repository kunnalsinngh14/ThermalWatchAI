import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card" style={{ padding: '10px 15px', border: '1px solid var(--border-glass)' }}>
        <p className="text-secondary" style={{ margin: '0 0 5px 0', fontSize: '0.85rem' }}>{label}</p>
        <p className="mono" style={{ margin: 0, color: payload[0].color, fontWeight: 600 }}>
          {payload[0].name}: {payload[0].value} {payload[0].payload.unit}
        </p>
      </div>
    );
  }
  return null;
};

export const TelemetryChart = ({ data, dataKey, title, strokeColor, fillColor }) => {
  return (
    <div className="glass-card fade-in" style={{ padding: '20px', height: '300px', display: 'flex', flexDirection: 'column' }}>
      <h4 style={{ color: 'var(--text-primary)', margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 500 }}>
        {title}
      </h4>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`color-${title.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fillColor} stopOpacity={0.8} />
                <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="var(--text-secondary)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis 
              stroke="var(--text-secondary)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => val}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={strokeColor} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#color-${title.replace(/[^a-zA-Z0-9]/g, '')})`} 
              activeDot={{ r: 6, strokeWidth: 0, fill: strokeColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
