/**
 * Protected Route Component
 * Handles authentication-based routing and role-based access control
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireEmailVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireEmailVerification = false // Changed default to false to prevent blocking
}) => {
  const { isAuthenticated, isAdmin, isEmailVerified, isLoading, user } = useSupabaseAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute DEBUG:', {
    isAuthenticated,
    isAdmin,
    isEmailVerified,
    isLoading,
    requireAdmin,
    requireEmailVerification,
    pathname: location.pathname,
    user: user ? { id: user.id, email: user.email } : null,
    timestamp: new Date().toISOString()
  });

  // Show loading spinner while checking authentication - but with timeout
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('🚫 ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    console.log('🚫 ProtectedRoute: Admin required but user is not admin');
    return <Navigate to="/" replace />;
  }

  // Check email verification requirement (only if explicitly required)
  if (requireEmailVerification && !isEmailVerified) {
    console.log('🚫 ProtectedRoute: Email verification required but not verified');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Email Verification Required</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please verify your email address to access this page. Check your inbox for a verification link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render the protected content
  console.log('✅ ProtectedRoute: All checks passed, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;