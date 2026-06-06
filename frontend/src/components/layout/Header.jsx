import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, LogOut, ShieldAlert, Wrench, LogIn } from 'lucide-react';
import LoginModal from './LoginModal';
import './Header.css';

const Header = () => {
  const { user, role, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <header className="header glass-card">
      <div className="header-left">
        <h2 className="header-title">ThermalWatch Dashboard</h2>
      </div>
      
      <div className="header-right">
        {role === 'guest' ? (
          <div className="auth-buttons">
            <button 
              className="btn-quick-login btn-engineer glow-border" 
              onClick={() => setIsLoginModalOpen(true)}
            >
              <LogIn size={16} />
              Login
            </button>
            <LoginModal 
              isOpen={isLoginModalOpen} 
              onClose={() => setIsLoginModalOpen(false)} 
            />
          </div>
        ) : (
          <div className="user-profile">
            <div className={`role-badge role-${role}`}>
              {role === 'admin' ? <ShieldAlert size={14} /> : <Wrench size={14} />}
              <span>{role.toUpperCase()}</span>
            </div>
            
            <div className="user-info">
              <User size={16} className="text-secondary" />
              <span className="user-email">{user?.email}</span>
            </div>
            
            <button className="btn-logout" onClick={logout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
