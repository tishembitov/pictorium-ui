// src/app/router/ProtectedRoute.tsx

import React, { ReactNode, useEffect, useRef } from 'react';
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
  const hasRedirectedRef = useRef(false);
  const redirectPathRef = useRef<string | null>(null);

  useEffect(() => {
    hasRedirectedRef.current = false;
    redirectPathRef.current = null;
  }, [location.pathname]);

  useEffect(() => {
    // Store the current path for redirect (only once, before redirect)
    if (!hasRedirectedRef.current && !isAuthenticated) {
      redirectPathRef.current = `${location.pathname}${location.search}`;
    }

    // Reset redirect flag when authenticated
    if (isAuthenticated) {
      hasRedirectedRef.current = false;
      redirectPathRef.current = null;
      return;
    }

    // Redirect to login if not authenticated
    if (isInitialized && !isLoading && !isAuthenticated && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      const redirectPath = redirectPathRef.current || `${location.pathname}${location.search}`;
      // Redirect to login with return URL
      login({ 
        redirectUri: `${globalThis.location.origin}${redirectPath}` 
      });
    }
  }, [isInitialized, isLoading, isAuthenticated, login, location.pathname, location.search]);

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