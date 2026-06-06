import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Activity } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import './FaultDetection.css';

export const DiagnosticForm = ({ onDiagnosticSubmit }) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    plantId: '1',
    unitId: '1',
    rpm: '3000',
    steamTemp: '540',
    pressure: '14.5'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = await api.post('/predict', { telemetry: formData });
      onDiagnosticSubmit(data);
    } catch (error) {
      addToast(error.message || 'Failed to execute diagnostics', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card diagnostic-form-container fade-in">
      <h3 className="form-title">Scope Specification Inputs</h3>
      <form onSubmit={handleSubmit} className="diagnostic-form">
        <div className="form-row">
          <div className="input-wrapper">
            <label className="input-label">Target Plant</label>
            <select name="plantId" value={formData.plantId} onChange={handleChange} className="input-field select-field">
              <option value="1">Ahmedabad Power Plant</option>
              <option value="2">Godda Power Plant</option>
            </select>
          </div>
          <Input label="Unit Identifier" type="number" name="unitId" value={formData.unitId} onChange={handleChange} min="1" max="20" required />
        </div>
        
        <h3 className="form-title" style={{ marginTop: '24px' }}>Operating Metrics</h3>
        <div className="form-row">
          <Input label="Turbine RPM" type="number" name="rpm" value={formData.rpm} onChange={handleChange} required />
          <Input label="Steam Temperature (°C)" type="number" step="0.1" name="steamTemp" value={formData.steamTemp} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <Input label="Pressure (MPa)" type="number" step="0.1" name="pressure" value={formData.pressure} onChange={handleChange} required />
          <div style={{ visibility: 'hidden' }}><Input label="Spacer" /></div> {/* Grid spacer */}
        </div>
        
        <Button 
          type="submit" 
          variant="primary" 
          size="lg" 
          className="w-full mt-4" 
          isLoading={loading}
        >
          <Activity size={20} />
          Execute Diagnostics
        </Button>
      </form>
    </div>
  );
};
