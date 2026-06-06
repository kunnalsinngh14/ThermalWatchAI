import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import './FaultDetection.css';

export const RaiseRequestModal = ({ isOpen, onClose, result, onSubmit }) => {
  const [priority, setPriority] = useState('High');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  if (!result) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        plantId: result.telemetry.plantId,
        unitId: result.telemetry.unitId,
        priority: priority,
        fault_type: result.problem_class,
        confidence_score: result.confidence_score,
        telemetry: result.telemetry
      };

      const data = await api.post('/requests', payload);
      
      onSubmit({ ...result, priority, ...data });
      onClose();
    } catch (error) {
      addToast(error.message || 'Failed to raise request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Raise Maintenance Request">
      <form onSubmit={handleSubmit} className="raise-request-form">
        <div className="summary-box">
          <div className="summary-row">
            <span className="summary-label">Target Asset:</span>
            <span className="summary-value">Plant {result.telemetry.plantId} - Unit {result.telemetry.unitId}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Detected Fault:</span>
            <span className="summary-value text-red">{result.problem_class} ({result.confidence_score}%)</span>
          </div>
        </div>

        <div className="input-wrapper" style={{ marginTop: '20px' }}>
          <label className="input-label">Priority Level</label>
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)} 
            className="input-field select-field"
          >
            <option value="High">High Priority - Immediate Action Required</option>
            <option value="Medium">Medium Priority - Schedule Maintenance</option>
            <option value="Low">Low Priority - Monitor Closely</option>
          </select>
        </div>

        <p className="notice-text text-dim" style={{ fontSize: '0.8rem', marginTop: '16px' }}>
          Submitting this form will trigger an automated SMTP email to administration containing all relevant asset telemetry.
        </p>

        <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <Button type="button" variant="ghost" onClick={onClose} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' }}>
            Cancel
          </Button>
          <Button type="submit" variant="warning" isLoading={loading} style={{ flex: 1 }}>
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};
