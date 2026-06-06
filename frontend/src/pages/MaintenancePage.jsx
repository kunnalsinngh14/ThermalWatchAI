import React, { useState, useEffect } from 'react';
import { RequestList } from '../components/requests/RequestList';
import { SortDropdown } from '../components/requests/SortDropdown';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const MaintenancePage = () => {
  const [requests, setRequests] = useState([]);
  const [sortOrder, setSortOrder] = useState('time_desc');
  const { addToast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await api.get('/requests?status=under_maintenance');
        sortAndSetRequests(data, sortOrder);
      } catch (err) {
        addToast(err.message || "Failed to fetch maintenance requests", "error");
      }
    };
    
    fetchRequests();
  }, []);

  const sortAndSetRequests = (data, order) => {
    let sorted = [...data];
    
    if (order === 'time_desc') {
      sorted.sort((a, b) => b.timestamp - a.timestamp);
    } else if (order === 'time_asc') {
      sorted.sort((a, b) => a.timestamp - b.timestamp);
    } else if (order === 'priority_desc') {
      const pmap = { 'High': 3, 'Medium': 2, 'Low': 1 };
      sorted.sort((a, b) => pmap[b.priority] - pmap[a.priority]);
    }
    
    setRequests(sorted);
  };

  const handleSort = (order) => {
    setSortOrder(order);
    sortAndSetRequests(requests, order);
  };

  const handleDrop = async (id) => {
    if(window.confirm("Are you sure you want to permanently DROP this unit?")) {
      try {
        await api.patch(`/requests/${id}/drop`);
        setRequests(requests.filter(r => r.id !== id));
        addToast('Request dropped and unit removed.', 'success');
      } catch (error) {
        addToast(error.message || 'Failed to drop request', 'error');
      }
    }
  };

  const handleRepair = async (id) => {
    if(window.confirm("Mark this unit as repaired?")) {
      try {
        await api.patch(`/requests/${id}/resolve`);
        setRequests(requests.filter(r => r.id !== id));
        addToast('Unit repaired and request resolved.', 'success');
      } catch (error) {
        addToast(error.message || 'Failed to resolve request', 'error');
      }
    }
  };

  // Initial sort effect
  useEffect(() => {
    if (requests.length > 0) handleSort(sortOrder);
  }, [requests.length]);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div className="requests-header">
        <h2 className="requests-title">Units Under Maintenance</h2>
        <SortDropdown value={sortOrder} onChange={handleSort} />
      </div>
      
      <RequestList 
        requests={requests} 
        onDrop={handleDrop} 
        onRepair={handleRepair} 
      />
    </div>
  );
};
