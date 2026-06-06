import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ allowedRoles }) => {
  const { role, token } = useAuth();

  // If there's no token, redirect to home (guest view)
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If user role is not in the allowedRoles array, redirect to home
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // Render child routes
  return <Outlet />;
};

export default ProtectedRoute;
