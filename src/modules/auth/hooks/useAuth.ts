import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type { LoginOptions, LogoutOptions, RegisterOptions } from '../types/auth.types';

/**
 * Main authentication hook
 * Provides authentication state and actions
 */
export const useAuth = () => {
  // Get state from store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const error = useAuthStore((state) => state.error);

  // Actions
  const login = useCallback(async (options?: LoginOptions) => {
    await authService.login(options);
  }, []);

  const logout = useCallback(async (options?: LogoutOptions) => {
    await authService.logout(options);
  }, []);

  const register = useCallback(async (options?: RegisterOptions) => {
    await authService.register(options);
  }, []);

  const refreshToken = useCallback(async () => {
    return authService.refreshToken();
  }, []);

  // Role helpers
  const hasRole = useCallback((role: string) => {
    return authService.hasRole(role);
  }, []);

  const hasAnyRole = useCallback((roles: string[]) => {
    return authService.hasAnyRole(roles);
  }, []);

  const hasAllRoles = useCallback((roles: string[]) => {
    return authService.hasAllRoles(roles);
  }, []);

  // Memoized return value
  return useMemo(() => ({
    // State
    isAuthenticated,
    isInitialized,
    isLoading,
    user,
    token,
    error,
    
    // User info shortcuts
    userId: user?.id,
    username: user?.username,
    email: user?.email,
    roles: user?.roles || [],
    
    // Actions
    login,
    logout,
    register,
    refreshToken,
    
    // Role helpers
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Service access for advanced usage
    authService,
  }), [
    isAuthenticated,
    isInitialized,
    isLoading,
    user,
    token,
    error,
    login,
    logout,
    register,
    refreshToken,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  ]);
};

export default useAuth;