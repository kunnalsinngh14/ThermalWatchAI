import React from 'react';
import { RequestCard } from './RequestCard';
import './Requests.css';

export const RequestList = ({ requests, onDrop, onRepair, onMaintain }) => {
  if (requests.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No requests found.
      </div>
    );
  }

  return (
    <div className="request-list">
      {requests.map(req => (
        <RequestCard 
          key={req.id} 
          request={req} 
          onDrop={onDrop}
          onRepair={onRepair}
          onMaintain={onMaintain}
        />
      ))}
    </div>
  );
};
