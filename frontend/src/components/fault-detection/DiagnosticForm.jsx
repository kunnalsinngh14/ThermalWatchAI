import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Activity } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import './FaultDetection.css';

export const DiagnosticForm = ({ onDiagnosticSubmit }) => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const [plants, setPlants] = useState([]);
  const [formData, setFormData] = useState({
    plantId: '',
    unitId: '1',
    rpm: '3000',
    steamTemp: '540',
    pressure: '14.5'
  });

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const data = await api.get('/plants');
        setPlants(data);
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, plantId: data[0].id.toString(), unitId: '1' }));
        }
      } catch (err) {
        addToast(err.message || 'Failed to fetch plants', 'error');
      }
    };
    fetchPlants();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'plantId') {
      // Reset unitId to 1 when changing plant
      setFormData({ ...formData, plantId: value, unitId: '1' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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

  const selectedPlant = plants.find(p => p.id.toString() === formData.plantId);
  const totalUnits = selectedPlant ? selectedPlant.units : 0;

  return (
    <div className="glass-card diagnostic-form-container fade-in">
      <h3 className="form-title">Scope Specification Inputs</h3>
      <form onSubmit={handleSubmit} className="diagnostic-form">
        <div className="form-row">
          <div className="input-wrapper">
            <label className="input-label">Target Plant</label>
            <select name="plantId" value={formData.plantId} onChange={handleChange} className="input-field select-field">
              {plants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="input-wrapper">
            <label className="input-label">Unit Identifier</label>
            <select name="unitId" value={formData.unitId} onChange={handleChange} className="input-field select-field">
              {[...Array(totalUnits)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Unit {i + 1}</option>
              ))}
            </select>
          </div>
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
