import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Trash2, Plus } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import '../components/admin/Admin.css';

export const ManagePlantsPage = () => {
  const [plants, setPlants] = useState([]);
  const [formData, setFormData] = useState({ name: '', capacity: '', units: '' });
  const { addToast } = useToast();

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const data = await api.get('/plants');
        setPlants(data);
      } catch (err) {
        addToast(err.message || 'Failed to fetch plants', 'error');
      }
    };
    fetchPlants();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      const payload = {
        name: formData.name,
        capacity: parseFloat(formData.capacity) || 0,
        units: parseInt(formData.units) || 0
      };
      await api.post('/plants', payload);
      addToast('Plant added successfully', 'success');
      setFormData({ name: '', capacity: '', units: '' });
      // Refresh plants
      const data = await api.get('/plants');
      setPlants(data);
    } catch (err) {
      addToast(err.message || 'Failed to add plant', 'error');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this plant and all its units?")) {
      try {
        await api.delete(`/plants/${id}`);
        setPlants(plants.filter(p => p.id !== id));
        addToast('Plant deleted successfully', 'success');
      } catch (err) {
        addToast(err.message || 'Failed to delete plant', 'error');
      }
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <h2 style={{ marginBottom: '24px', fontWeight: 500 }}>Manage Plants</h2>
      
      <div className="admin-container">
        {/* Form Panel */}
        <div className="glass-card admin-panel">
          <h3 className="admin-title">Add New Plant</h3>
          <form onSubmit={handleAdd} className="admin-form">
            <Input label="Plant Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <Input label="Nameplate Capacity (MW)" type="number" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
            <Input label="Baseline Units" type="number" required value={formData.units} onChange={e => setFormData({...formData, units: e.target.value})} />
            <Button type="submit" variant="primary" className="w-full mt-4">
              <Plus size={18} /> Add Plant
            </Button>
          </form>
        </div>

        {/* Table Panel */}
        <div className="glass-card admin-panel">
          <h3 className="admin-title">Active Facilities</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Plant Name</th>
                  <th>Capacity (MW)</th>
                  <th>Units</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plants.map(p => (
                  <tr key={p.id}>
                    <td className="mono">{p.id}</td>
                    <td>{p.name}</td>
                    <td className="mono">{p.capacity}</td>
                    <td className="mono">{p.units}</td>
                    <td>
                      <Button variant="danger" className="btn-icon" onClick={() => handleDelete(p.id)} title="Remove Plant">
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {plants.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No plants configured.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
