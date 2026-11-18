import React from 'react';
import { Navigate } from 'react-router-dom';

// Only lets a logged-in user with the right role see the page.
function ProtectedRoute({ role, children }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {
    user = null;
  }
  if (!localStorage.getItem('token') || !user) return <Navigate to="/" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} replace />;
  }
  return children;
}

export default ProtectedRoute;
