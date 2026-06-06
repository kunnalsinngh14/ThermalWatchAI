import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Factory, 
  Activity, 
  ClipboardList, 
  Settings, 
  PlusCircle, 
  Users,
  FileText,
  Wrench,
  History,
  CheckSquare,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import './Sidebar.css';

const Sidebar = () => {
  const { role } = useAuth();
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const data = await api.get('/plants');
        setPlants(data);
      } catch (err) {
        console.error('Failed to fetch plants in sidebar', err);
      }
    };
    fetchPlants();
    
    const interval = setInterval(fetchPlants, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon glow-border">
          <Activity size={24} className="text-crimson" />
        </div>
        <h2 className="logo-text">Thermal<span className="text-crimson">Watch</span></h2>
      </div>

      <div className="sidebar-scroll">
        <nav className="nav-section">
          <h3 className="nav-heading">DASHBOARDS</h3>
          <NavLink to="/" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} end>
            <Home size={18} />
            <span>Global Overview</span>
          </NavLink>
          
          {plants.map(plant => (
            <NavLink 
              key={plant.id} 
              to={`/plant/${plant.id}`} 
              className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
            >
              <Factory size={18} />
              <span className="truncate">{plant.name}</span>
            </NavLink>
          ))}
        </nav>

        {role === 'engineer' && (
          <nav className="nav-section fade-in">
            <h3 className="nav-heading">ENGINEERING</h3>
            <NavLink to="/fault-detection" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Activity size={18} />
              <span>Fault Detection</span>
            </NavLink>
            <NavLink to="/stats-submission" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <FileText size={18} />
              <span>Stats Submission</span>
            </NavLink>
          </nav>
        )}

        {(role === 'engineer' || role === 'admin') && (
          <nav className="nav-section fade-in">
            <h3 className="nav-heading">OPERATIONS</h3>
            <NavLink to="/requests" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <ClipboardList size={18} />
              <span>Raised Requests</span>
            </NavLink>
            <NavLink to="/maintenance" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Wrench size={18} />
              <span>Under Maintenance</span>
            </NavLink>
            {role === 'engineer' && (
              <NavLink to="/admin/units" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                <PlusCircle size={18} />
                <span>Manage Units</span>
              </NavLink>
            )}
          </nav>
        )}

        {(role === 'engineer' || role === 'admin') && (
          <nav className="nav-section fade-in">
            <h3 className="nav-heading">HISTORY LOGS</h3>
            <NavLink to="/history/faults" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <History size={18} />
              <span>Fault History</span>
            </NavLink>
            <NavLink to="/history/maintenance" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <CheckSquare size={18} />
              <span>Maintenance History</span>
            </NavLink>
            <NavLink to="/history/dropped" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Trash2 size={18} />
              <span>Dropped History</span>
            </NavLink>
          </nav>
        )}

        {role === 'admin' && (
          <nav className="nav-section fade-in">
            <h3 className="nav-heading">ADMINISTRATION</h3>
            <NavLink to="/admin/plants" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Settings size={18} />
              <span>Manage Plants</span>
            </NavLink>
            <NavLink to="/admin/units" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <PlusCircle size={18} />
              <span>Manage Units</span>
            </NavLink>
            <NavLink to="/admin/engineers" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Users size={18} />
              <span>Manage Engineers</span>
            </NavLink>
          </nav>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
