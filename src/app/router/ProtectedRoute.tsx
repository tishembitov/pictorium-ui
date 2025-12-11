import React, { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
  fallback?: ReactNode;
}

const DefaultFallback: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    Loading...
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles = [],
  fallback,
}) => {
  const { isAuthenticated, isLoading, isInitialized, login, hasRole } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      // Redirect to login with return URL
      login({ 
        redirectUri: `${globalThis.location.origin}${location.pathname}${location.search}` 
      });
    }
  }, [isInitialized, isLoading, isAuthenticated, login, location]);

  // Still loading
  if (!isInitialized || isLoading) {
    return fallback ? <>{fallback}</> : <DefaultFallback />;
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : <DefaultFallback />;
  }

  // Check roles if specified
  if (roles.length > 0) {
    const hasRequiredRole = roles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <p>You don&apos;t have permission to access this page.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;