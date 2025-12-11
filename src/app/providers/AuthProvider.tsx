import React, { useEffect, type ReactNode } from 'react';
import { keycloak, keycloakInitOptions } from '../config/keycloak';
import { authService } from '@/modules/auth/services/authService';
import { useAuthStore } from '@/modules/auth/stores/authStore';

interface AuthProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  fallback = null 
}) => {
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        await keycloak.init(keycloakInitOptions);
        authService.setupEventHandlers();
        useAuthStore.getState().updateFromKeycloak(keycloak);
      } catch (error) {
        console.error('Keycloak initialization failed:', error);
        useAuthStore.getState().setInitialized(true);
      }
    };

    initKeycloak();
  }, []);

  if (!isInitialized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};