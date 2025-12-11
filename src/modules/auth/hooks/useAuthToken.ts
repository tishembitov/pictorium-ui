import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';

interface UseAuthTokenOptions {
  autoRefresh?: boolean;
  refreshThreshold?: number; // seconds before expiry to trigger refresh
}

interface TokenState {
  token: string | null;
  isValid: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  expiresAt: number | null;
  expiresIn: number | null; // seconds until expiry
}

// Helper function to calculate token state
const calculateTokenState = (
  currentToken: string | null,
  expiry: number | null,
  refreshThreshold: number
): TokenState => {
  const now = Date.now();
  const expiresIn = expiry ? Math.floor((expiry - now) / 1000) : null;

  return {
    token: currentToken,
    isValid: !!currentToken && !!expiry && now < expiry,
    isExpired: !!expiry && now >= expiry,
    isExpiringSoon: !!expiry && expiresIn !== null && expiresIn <= refreshThreshold,
    expiresAt: expiry,
    expiresIn,
  };
};

/**
 * Hook to access and manage auth token
 */
export const useAuthToken = (options: UseAuthTokenOptions = {}) => {
  const { autoRefresh = true, refreshThreshold = 30 } = options;

  const token = useAuthStore((state) => state.token);
  const tokenExpiry = useAuthStore((state) => state.tokenExpiry);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Calculate token state synchronously from store values
  const tokenState = useMemo((): TokenState => {
    if (!isAuthenticated || !tokenExpiry) {
      return {
        token: null,
        isValid: false,
        isExpired: true,
        isExpiringSoon: false,
        expiresAt: null,
        expiresIn: null,
      };
    }
    return calculateTokenState(token, tokenExpiry, refreshThreshold);
  }, [token, tokenExpiry, isAuthenticated, refreshThreshold]);

  // Auto-refresh when token is expiring soon
  // Using useMemo to trigger side effect check (not ideal but avoids setState in effect)
  useMemo(() => {
    if (autoRefresh && tokenState.isExpiringSoon && !tokenState.isExpired && isAuthenticated) {
      // Fire and forget - the store will update when token refreshes
      authService.refreshToken().catch(console.error);
    }
  }, [autoRefresh, tokenState.isExpiringSoon, tokenState.isExpired, isAuthenticated]);

  // Manual refresh
  const refresh = useCallback(async () => {
    return authService.refreshToken();
  }, []);

  // Force refresh
  const forceRefresh = useCallback(async () => {
    return authService.forceRefreshToken();
  }, []);

  // Get fresh token (refresh if needed)
  const getFreshToken = useCallback(async (): Promise<string | null> => {
    if (!isAuthenticated) {
      return null;
    }

    if (tokenState.isExpired || tokenState.isExpiringSoon) {
      const success = await authService.refreshToken();
      if (!success) {
        return null;
      }
    }

    return authService.getToken() ?? null;
  }, [isAuthenticated, tokenState.isExpired, tokenState.isExpiringSoon]);

  // Get authorization header
  const getAuthHeader = useCallback(async (): Promise<string | null> => {
    const freshToken = await getFreshToken();
    return freshToken ? `Bearer ${freshToken}` : null;
  }, [getFreshToken]);

  return useMemo(
    () => ({
      ...tokenState,

      // Actions
      refresh,
      forceRefresh,
      getFreshToken,
      getAuthHeader,

      // Status
      isAuthenticated,
    }),
    [tokenState, refresh, forceRefresh, getFreshToken, getAuthHeader, isAuthenticated]
  );
};

/**
 * Simple hook to just get the current token
 */
export const useToken = () => {
  return useAuthStore((state) => state.token);
};

/**
 * Hook to get Bearer token header
 */
export const useBearerToken = () => {
  const token = useAuthStore((state) => state.token);
  return token ? `Bearer ${token}` : null;
};

export default useAuthToken;