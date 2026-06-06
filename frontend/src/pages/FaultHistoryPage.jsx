import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { AlertTriangle } from 'lucide-react';
import '../components/admin/Admin.css';

export const FaultHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.get('/history/faults');
        setHistory(data);
      } catch (err) {
        addToast(err.message || 'Failed to fetch fault history', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      'open': { label: 'Open / Raised', cls: 'status-faulty' },
      'under_maintenance': { label: 'Under Maintenance', cls: 'status-maintenance' },
      'resolved': { label: 'Resolved / Fixed', cls: 'status-running' },
      'dropped': { label: 'Dropped', cls: 'status-dropped' }
    };
    const s = map[status] || { label: status, cls: '' };
    return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <h2 style={{ marginBottom: '24px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertTriangle className="text-crimson" />
        Fault History Log
      </h2>

      {loading ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading fault logs...
        </div>
      ) : history.length > 0 ? (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Plant Name</th>
                  <th>Unit #</th>
                  <th>Fault Type</th>
                  <th>Priority</th>
                  <th>Confidence</th>
                  <th>Reported Date</th>
                  <th>Current Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id}>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>#{log.id}</td>
                    <td style={{ fontWeight: 500 }}>{log.plantName}</td>
                    <td className="mono">Unit {log.unitNumber}</td>
                    <td className="text-red" style={{ fontWeight: 500 }}>{log.faultType}</td>
                    <td>
                      <span className={`rc-badge-priority rc-priority-${log.priority}`} style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px' }}>
                        {log.priority}
                      </span>
                    </td>
                    <td className="mono">{parseFloat(log.confidence).toFixed(1)}%</td>
                    <td className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>{getStatusBadge(log.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
          No fault records found.
        </div>
      )}
    </div>
  );
};
