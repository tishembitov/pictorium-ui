import React, { type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { FullPageLoader } from '@/shared/components/feedback/FullPageLoader';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles = [],
  fallback,
}) => {
  const { isAuthenticated, isLoading, isInitialized, login, roles: userRoles } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      // Redirect to login with return URL
      login(`${window.location.origin}${location.pathname}${location.search}`);
    }
  }, [isInitialized, isLoading, isAuthenticated, login, location]);

  // Still loading
  if (!isInitialized || isLoading) {
    return fallback ? <>{fallback}</> : <FullPageLoader />;
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : <FullPageLoader />;
  }

  // Check roles if specified
  if (roles.length > 0) {
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    if (!hasRequiredRole) {
      // User doesn't have required role - show unauthorized or redirect
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <p>You don't have permission to access this page.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// HOC version for wrapping route elements
export const withProtectedRoute = (
  Component: React.ComponentType,
  options?: { roles?: string[] }
) => {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRoute roles={options?.roles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

export default ProtectedRoute;