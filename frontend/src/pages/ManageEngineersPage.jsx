import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Trash2, UserPlus, Edit2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import '../components/admin/Admin.css';

export const ManageEngineersPage = () => {
  const [engineers, setEngineers] = useState([]);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [editingId, setEditingId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const data = await api.get('/engineers');
        setEngineers(data);
      } catch (err) {
        addToast(err.message || 'Failed to fetch engineers', 'error');
      }
    };
    fetchEngineers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email) return;
    try {
      if (editingId) {
        await api.patch(`/engineers/${editingId}`, formData);
        addToast('Engineer updated successfully', 'success');
      } else {
        await api.post('/engineers', formData);
        addToast('Engineer provisioned successfully', 'success');
      }
      setFormData({ email: '', password: '' });
      setEditingId(null);
      // Refresh engineers list
      const data = await api.get('/engineers');
      setEngineers(data);
    } catch (err) {
      addToast(err.message || (editingId ? 'Failed to update engineer' : 'Failed to provision engineer'), 'error');
    }
  };

  const handleEdit = (engineer) => {
    setFormData({ email: engineer.email, password: '' });
    setEditingId(engineer.id);
  };

  const handleCancelEdit = () => {
    setFormData({ email: '', password: '' });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if(window.confirm("Revoke this engineer's access?")) {
      try {
        await api.delete(`/engineers/${id}`);
        setEngineers(engineers.filter(e => e.id !== id));
        addToast('Engineer access revoked', 'success');
        if (editingId === id) {
          handleCancelEdit();
        }
      } catch (err) {
        addToast(err.message || 'Failed to revoke access', 'error');
      }
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <h2 style={{ marginBottom: '24px', fontWeight: 500 }}>Manage Engineering Personnel</h2>
      
      <div className="admin-container">
        {/* Form Panel */}
        <div className="glass-card admin-panel">
          <h3 className="admin-title">{editingId ? 'Update Engineer Account' : 'Provision New Account'}</h3>
          <form onSubmit={handleSubmit} className="admin-form">
            <Input label="Email Address" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <Input label={editingId ? "New Password (Optional)" : "Temporary Password"} type="text" required={!editingId} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button type="submit" variant="primary" className="w-full">
                <UserPlus size={18} /> {editingId ? 'Update Account' : 'Provision Engineer'}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Table Panel */}
        <div className="glass-card admin-panel">
          <h3 className="admin-title">Active Engineers</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Provisioned Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {engineers.map(e => (
                  <tr key={e.id}>
                    <td className="mono">{e.id}</td>
                    <td>{e.email}</td>
                    <td className="mono">{new Date(e.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="ghost" className="btn-icon" onClick={() => handleEdit(e)} title="Edit Engineer">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="danger" className="btn-icon" onClick={() => handleDelete(e.id)} title="Revoke Access">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
