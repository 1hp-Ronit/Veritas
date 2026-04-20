import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brandBlue border-t-transparent rounded-full animate-spin" />
          <span className="text-textSecondary text-sm font-medium">Loading session…</span>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
