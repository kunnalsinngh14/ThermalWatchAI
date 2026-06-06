import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, Wrench, LogIn, Menu, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoginModal from './LoginModal';
import './Header.css';

const Header = ({ toggleSidebar }) => {
  const { role } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <header className="header glass-card">
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={toggleSidebar} className="btn-icon" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <Menu size={24} />
        </button>
        {role !== 'guest' && (
          <Link to="/ai-assistant" className="btn-quick-ai glow-border" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--accent-primary)', borderRadius: '8px', color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s ease' }}>
            <Sparkles size={16} />
            Click here to use your AI Assistant
          </Link>
        )}
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
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
