import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';
import { Clock, AlertCircle, Trash2, CheckCircle, Wrench } from 'lucide-react';
import './Requests.css';

export const RequestCard = ({ request, onDrop, onRepair, onMaintain }) => {
  const { role } = useAuth();
  
  return (
    <div className="glass-card request-card fade-in">
      <div className="rc-left">
        <div className="rc-header">
          <span className="rc-asset-name">{request.plantName} - Unit {request.unitId}</span>
          <span className={`rc-badge-priority rc-priority-${request.priority}`}>
            {request.priority}
          </span>
        </div>
        <div className="rc-details">
          <div className="rc-detail-item text-red">
            <AlertCircle size={14} />
            <span>{request.faultType} ({request.confidence}%)</span>
          </div>
          <div className="rc-detail-item">
            <span>By: Engineer {request.engineerId}</span>
          </div>
        </div>
      </div>
      
      <div className="rc-right">
        <div className="rc-time">
          <Clock size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
          {new Date(request.timestamp).toLocaleString()}
        </div>
        
        {role === 'admin' && (onMaintain || onRepair || onDrop) && (
          <div className="rc-actions">
            {onMaintain && (
              <Button variant="warning" className="btn-icon" onClick={() => onMaintain(request.id)} title="Mark Under Maintenance">
                <Wrench size={16} />
              </Button>
            )}
            {onRepair && (
              <Button variant="success" className="btn-icon" onClick={() => onRepair(request.id)} title="Mark Fixed">
                <CheckCircle size={16} />
              </Button>
            )}
            {onDrop && (
              <Button variant="danger" className="btn-icon" onClick={() => onDrop(request.id)} title="Drop Unit">
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
