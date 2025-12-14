import React, { useEffect, useRef, type ReactNode } from 'react';
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
  const initStartedRef = useRef(false);
  const handlersSetupRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initStartedRef.current) {
      return;
    }

    initStartedRef.current = true;

    const initKeycloak = async () => {
      try {
        // Setup event handlers only once, before init
        if (!handlersSetupRef.current) {
          authService.setupEventHandlers();
          handlersSetupRef.current = true;
        }

        // Initialize Keycloak
        await keycloak.init(keycloakInitOptions);
        
        // Update store state
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