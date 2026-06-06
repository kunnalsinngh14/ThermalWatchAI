import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import '../components/admin/Admin.css';

export const ManageUnitsPage = () => {
  const [units, setUnits] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState('all');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { role } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unitsData, plantsData] = await Promise.all([
        api.get('/units'),
        api.get('/plants')
      ]);
      setUnits(unitsData);
      setPlants(plantsData);
    } catch (err) {
      addToast(err.message || 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredUnits = selectedPlant === 'all' 
    ? units 
    : units.filter(u => u.plantId.toString() === selectedPlant);

  const handleStatusChange = async (unitId, newStatus) => {
    try {
      await api.patch(`/units/${unitId}/status`, { status: newStatus });
      addToast(`Unit status updated to ${newStatus.replace('_', ' ')}`, 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (!window.confirm('Are you sure you want to permanently remove this unit?')) return;
    try {
      await api.delete(`/units/${unitId}`);
      addToast('Unit removed successfully', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to delete unit', 'error');
    }
  };

  const handleAddUnit = async (plantId) => {
    try {
      await api.post(`/plants/${plantId}/units`);
      addToast('New unit added successfully', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to add unit', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'running': { label: 'Running', cls: 'status-running' },
      'faulty': { label: 'Faulty', cls: 'status-faulty' },
      'under_maintenance': { label: 'Under Maintenance', cls: 'status-maintenance' },
      'dropped': { label: 'Dropped', cls: 'status-dropped' }
    };
    const s = map[status] || { label: status, cls: '' };
    return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
  };

  // Group units by plant for section display
  const plantGroups = plants.map(p => ({
    ...p,
    plantUnits: filteredUnits.filter(u => u.plantId === p.id)
  })).filter(p => selectedPlant === 'all' || p.id.toString() === selectedPlant);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontWeight: 500 }}>{role === 'admin' ? 'Manage Operating Units' : 'Operating Units List'}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Filter by Plant:</label>
          <select 
            value={selectedPlant} 
            onChange={(e) => setSelectedPlant(e.target.value)}
            style={{ fontSize: '0.9rem', padding: '8px 12px', minWidth: '200px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer' }}
          >
            <option value="all">All Plants</option>
            {plants.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading units...
        </div>
      ) : (
        plantGroups.map(plant => (
          <div key={plant.id} className="glass-card" style={{ marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px',
              background: 'rgba(220, 38, 38, 0.06)',
              borderBottom: '1px solid var(--border-glass)'
            }}>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>{plant.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {plant.plantUnits.length} unit(s) · Capacity: {plant.capacity} MW
                </span>
              </div>
              {role === 'admin' && (
                <button 
                  className="btn-sm btn-success" 
                  onClick={() => handleAddUnit(plant.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Unit
                </button>
              )}
            </div>

            {plant.plantUnits.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Plant ID</th>
                      <th>Unit ID</th>
                      <th>Unit #</th>
                      <th>Status</th>
                      {role === 'admin' && <th>Change Status</th>}
                      {role === 'admin' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {plant.plantUnits.map(unit => (
                      <tr key={unit.id}>
                        <td className="mono" style={{ color: 'var(--text-secondary)' }}>{unit.plantId}</td>
                        <td className="mono">{unit.id}</td>
                        <td className="mono">Unit {unit.unitNumber}</td>
                        <td>{getStatusBadge(unit.status)}</td>
                        {role === 'admin' && (
                          <td>
                            <select
                              value={unit.status}
                              onChange={(e) => handleStatusChange(unit.id, e.target.value)}
                              style={{
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-glass)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                fontSize: '0.82rem',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="running">Running</option>
                              <option value="faulty">Faulty</option>
                              <option value="under_maintenance">Under Maintenance</option>
                              <option value="dropped">Dropped</option>
                            </select>
                          </td>
                        )}
                        {role === 'admin' && (
                          <td>
                            <button 
                              className="btn-sm btn-danger" 
                              onClick={() => handleDeleteUnit(unit.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                No units found for this plant.
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
