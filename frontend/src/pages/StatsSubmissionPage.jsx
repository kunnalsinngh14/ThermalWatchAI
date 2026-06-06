import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ClipboardList } from 'lucide-react';

export const StatsSubmissionPage = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plants, setPlants] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    plantId: '',
    powerGenerated: '',
    auxiliaryPower: '',
    waterConsumption: '',
    coalConsumption: '',
    co2Emissions: '',
    flyAsh: ''
  });

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const data = await api.get('/plants');
        setPlants(data);
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, plantId: data[0].id.toString() }));
        }
      } catch (err) {
        addToast(err.message || 'Failed to fetch plants', 'error');
      }
    };
    fetchPlants();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/submissions', formData);
      addToast('Daily stats submitted successfully!', 'success');
      // Reset form (keep date and plant selection)
      setFormData({
        date: formData.date,
        plantId: formData.plantId,
        powerGenerated: '',
        auxiliaryPower: '',
        waterConsumption: '',
        coalConsumption: '',
        co2Emissions: '',
        flyAsh: ''
      });
    } catch (error) {
      addToast(error.message || 'Failed to submit stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ClipboardList className="text-crimson" />
        Daily Stats Submission
      </h2>

      <div className="glass-card" style={{ padding: '28px' }}>
        <form onSubmit={handleSubmit}>
          <h3 className="form-title" style={{ marginBottom: '20px' }}>Scope & Date</h3>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <Input 
              label="Select Date" 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange} 
              required 
            />
            <div className="input-wrapper">
              <label className="input-label">Target Plant</label>
              <select 
                name="plantId" 
                value={formData.plantId} 
                onChange={handleChange} 
                className="input-field select-field"
                style={{ height: '42px' }}
              >
                {plants.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <h3 className="form-title" style={{ marginTop: '30px', marginBottom: '20px' }}>Operating Metrics</h3>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <Input 
              label="Power Generated (MWh)" 
              type="number" 
              step="0.01" 
              name="powerGenerated" 
              value={formData.powerGenerated} 
              onChange={handleChange} 
              placeholder="e.g. 18500"
              required 
            />
            <Input 
              label="Auxiliary Power Consumption (MW)" 
              type="number" 
              step="0.01" 
              name="auxiliaryPower" 
              value={formData.auxiliaryPower} 
              onChange={handleChange} 
              placeholder="e.g. 85.5"
              required 
            />
          </div>

          <h3 className="form-title" style={{ marginTop: '30px', marginBottom: '20px' }}>Environmental Statistics</h3>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <Input 
              label="Water Consumption (m³/h)" 
              type="number" 
              step="0.01" 
              name="waterConsumption" 
              value={formData.waterConsumption} 
              onChange={handleChange} 
              placeholder="e.g. 4200"
              required 
            />
            <Input 
              label="Coal Consumption (t/h)" 
              type="number" 
              step="0.01" 
              name="coalConsumption" 
              value={formData.coalConsumption} 
              onChange={handleChange} 
              placeholder="e.g. 320"
              required 
            />
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <Input 
              label="CO₂ Emissions (t/h)" 
              type="number" 
              step="0.01" 
              name="co2Emissions" 
              value={formData.co2Emissions} 
              onChange={handleChange} 
              placeholder="e.g. 890"
              required 
            />
            <Input 
              label="Fly Ash Generated (t/h)" 
              type="number" 
              step="0.01" 
              name="flyAsh" 
              value={formData.flyAsh} 
              onChange={handleChange} 
              placeholder="e.g. 45"
              required 
            />
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            className="w-full mt-4" 
            isLoading={loading}
            style={{ width: '100%', marginTop: '20px' }}
          >
            Submit Daily Stats
          </Button>
        </form>
      </div>
    </div>
  );
};
