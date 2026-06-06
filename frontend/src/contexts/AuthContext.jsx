import React, { createContext, useState, useEffect } from 'react';

import { api } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        // Decode JWT to set user info on load
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.user_id, email: payload.email });
        setRole(payload.role);
      } catch (e) {
        console.error("Invalid token", e);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: jwtToken, user: userData } = response;
      
      setToken(jwtToken);
      localStorage.setItem('token', jwtToken);
      setUser({ id: userData.id, email: userData.email });
      setRole(userData.role);
      return userData.role;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRole('guest');
    localStorage.removeItem('token');
  };

  if (loading) {
    return <div className="loader-container">Loading...</div>; // Temporary loader
  }

  return (
    <AuthContext.Provider value={{ user, role, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
