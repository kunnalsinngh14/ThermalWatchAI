import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Trash2, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import '../components/admin/Admin.css';

export const ManageEngineersPage = () => {
  const [engineers, setEngineers] = useState([]);
  const [formData, setFormData] = useState({ email: '', password: '' });
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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.email) return;
    try {
      await api.post('/engineers', formData);
      addToast('Engineer provisioned successfully', 'success');
      setFormData({ email: '', password: '' });
      // Refresh engineers list
      const data = await api.get('/engineers');
      setEngineers(data);
    } catch (err) {
      addToast(err.message || 'Failed to provision engineer', 'error');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Revoke this engineer's access?")) {
      try {
        await api.delete(`/engineers/${id}`);
        setEngineers(engineers.filter(e => e.id !== id));
        addToast('Engineer access revoked', 'success');
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
          <h3 className="admin-title">Provision New Account</h3>
          <form onSubmit={handleAdd} className="admin-form">
            <Input label="Email Address" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <Input label="Temporary Password" type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <Button type="submit" variant="primary" className="w-full mt-4">
              <UserPlus size={18} /> Provision Engineer
            </Button>
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
                      <Button variant="danger" className="btn-icon" onClick={() => handleDelete(e.id)} title="Revoke Access">
                        <Trash2 size={16} />
                      </Button>
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
