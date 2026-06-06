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
  Trash2,
  User,
  LogOut,
  ShieldAlert,
  LogIn,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import LoginModal from './LoginModal';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const { user, role, logout } = useAuth();
  const [plants, setPlants] = useState([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
    <aside className={`sidebar ${isOpen ? '' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo-icon glow-border">
          <Activity size={24} className="text-blue" />
        </div>
      </div>

      <div className="sidebar-scroll">
        <nav className="nav-section">
          <h3 className="nav-heading">DASHBOARDS</h3>
          <NavLink to="/" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} end>
            <Home size={18} />
            <span>Global Overview</span>
          </NavLink>
          
          {role !== 'guest' && (
            <NavLink to="/ai-assistant" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
              <Sparkles size={18} className="text-blue" />
              <span style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>AI Assistant</span>
            </NavLink>
          )}
          
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

      <div className="sidebar-footer">
        {role === 'guest' ? (
          <div className="sidebar-auth-buttons">
            <button 
              className="btn-sidebar-login glow-border" 
              onClick={() => setIsLoginModalOpen(true)}
            >
              <LogIn size={16} />
              <span>Login</span>
            </button>
            <LoginModal 
              isOpen={isLoginModalOpen} 
              onClose={() => setIsLoginModalOpen(false)} 
            />
          </div>
        ) : (
          <div className="sidebar-user-profile">
            <div className="sidebar-user-info">
              <div className={`role-badge role-${role}`}>
                {role === 'admin' ? <ShieldAlert size={14} /> : <Wrench size={14} />}
                <span>{role.toUpperCase()}</span>
              </div>
            </div>
            
            <button className="btn-sidebar-logout" onClick={logout} title="Logout">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
