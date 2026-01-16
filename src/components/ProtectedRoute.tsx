import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authUtils } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  useEffect(() => {
    // Check authentication on mount
    if (!authUtils.isAuthenticated()) {
      authUtils.redirectToLogin(window.location.pathname);
    }
  }, []);

  // If not authenticated, redirect to login
  if (!authUtils.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;