import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Trash2 } from 'lucide-react';
import '../components/admin/Admin.css';

export const DroppedHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.get('/history/dropped');
        setHistory(data);
      } catch (err) {
        addToast(err.message || 'Failed to fetch dropped history', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <h2 style={{ marginBottom: '24px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Trash2 className="text-red" />
        Dropped Units History Log
      </h2>

      {loading ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading dropped history...
        </div>
      ) : history.length > 0 ? (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Plant Name</th>
                  <th>Decommissioned Unit #</th>
                  <th>Critical Fault Type</th>
                  <th>Final Confidence</th>
                  <th>Date Dropped & Removed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id}>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>#{log.id}</td>
                    <td style={{ fontWeight: 500 }}>{log.plantName}</td>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>Unit {log.unitNumber}</td>
                    <td className="text-red" style={{ fontWeight: 500 }}>{log.faultType}</td>
                    <td className="mono">{parseFloat(log.confidence).toFixed(1)}%</td>
                    <td className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="status-badge status-dropped">Decommissioned</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
          No decommissioned records found.
        </div>
      )}
    </div>
  );
};
