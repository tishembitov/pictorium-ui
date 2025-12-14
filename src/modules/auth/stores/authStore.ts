import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type Keycloak from 'keycloak-js';
import type { 
  AuthState, 
  AuthActions, 
  AuthUser, 
  AuthError,
  KeycloakTokenParsed 
} from '../types/auth.types';
import { STORAGE_KEYS } from '@/shared/utils/constants';

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  isInitialized: false,
  isLoading: true,
  token: null,
  refreshToken: null,
  tokenExpiry: null,
  user: null,
  error: null,
};

// Parse user from Keycloak token
const parseUserFromToken = (tokenParsed: KeycloakTokenParsed): AuthUser => ({
  id: tokenParsed.sub,
  username: tokenParsed.preferred_username,
  email: tokenParsed.email,
  emailVerified: tokenParsed.email_verified,
  firstName: tokenParsed.given_name,
  lastName: tokenParsed.family_name,
  roles: tokenParsed.realm_access?.roles || [],
});

// Store type
type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        ...initialState,

        // Actions
        setAuthenticated: (authenticated: boolean) => 
          set({ isAuthenticated: authenticated }, false, 'setAuthenticated'),

        setUser: (user: AuthUser | null) => 
          set({ user }, false, 'setUser'),

        setToken: (token: string | null) => 
          set({ token }, false, 'setToken'),

        setLoading: (isLoading: boolean) => 
          set({ isLoading }, false, 'setLoading'),

        setError: (error: AuthError | null) => 
          set({ error }, false, 'setError'),

        setInitialized: (isInitialized: boolean) => 
          set({ isInitialized, isLoading: false }, false, 'setInitialized'),

        reset: () => 
          set(initialState, false, 'reset'),

        // Update state from Keycloak instance
        updateFromKeycloak: (keycloak: Keycloak) => {
          if (keycloak.authenticated && keycloak.tokenParsed) {
            const user = parseUserFromToken(keycloak.tokenParsed as KeycloakTokenParsed);
            set({
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
              token: keycloak.token || null,
              refreshToken: keycloak.refreshToken || null,
              tokenExpiry: keycloak.tokenParsed.exp ? keycloak.tokenParsed.exp * 1000 : null,
              user,
              error: null,
            }, false, 'updateFromKeycloak');
          } else {
            set({
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
              token: null,
              refreshToken: null,
              tokenExpiry: null,
              user: null,
              error: null,
            }, false, 'updateFromKeycloak');
          }
        },
      }),
      {
        name: STORAGE_KEYS.AUTH_STATE,
        // Only persist minimal data
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Selectors
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsInitialized = (state: AuthStore) => state.isInitialized;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectUser = (state: AuthStore) => state.user;
export const selectToken = (state: AuthStore) => state.token;
export const selectError = (state: AuthStore) => state.error;
export const selectUserId = (state: AuthStore) => state.user?.id;
export const selectUsername = (state: AuthStore) => state.user?.username;
export const selectUserRoles = (state: AuthStore) => state.user?.roles || [];

// Computed selectors
export const selectHasRole = (role: string) => (state: AuthStore) => 
  state.user?.roles.includes(role) || false;

export const selectHasAnyRole = (roles: string[]) => (state: AuthStore) => 
  roles.some(role => state.user?.roles.includes(role));

export const selectHasAllRoles = (roles: string[]) => (state: AuthStore) => 
  roles.every(role => state.user?.roles.includes(role));

export const selectIsTokenExpired = (state: AuthStore) => {
  if (!state.tokenExpiry) return true;
  return Date.now() >= state.tokenExpiry;
};

export default useAuthStore;