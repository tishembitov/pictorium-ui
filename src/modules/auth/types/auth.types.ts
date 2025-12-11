import type Keycloak from 'keycloak-js';

// Auth state
export interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  user: AuthUser | null;
  error: AuthError | null;
}

// Authenticated user info from token
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

// Auth error
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: string;
}

// Error codes
export type AuthErrorCode =
  | 'INIT_FAILED'
  | 'LOGIN_FAILED'
  | 'LOGOUT_FAILED'
  | 'TOKEN_REFRESH_FAILED'
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'UNKNOWN';

// Token info
export interface TokenInfo {
  token: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt: number;
}

// Parsed Keycloak token
export interface KeycloakTokenParsed {
  sub: string;
  preferred_username: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: Record<string, { roles: string[] }>;
  exp: number;
  iat: number;
  auth_time?: number;
  session_state?: string;
  acr?: string;
  scope?: string;
}

// Login options
export interface LoginOptions {
  redirectUri?: string;
  prompt?: 'none' | 'login' | 'consent' | 'select_account';
  loginHint?: string;
  idpHint?: string;
  scope?: string;
  locale?: string;
}

// Register options
export interface RegisterOptions {
  redirectUri?: string;
  locale?: string;
}

// Logout options
export interface LogoutOptions {
  redirectUri?: string;
}

// Auth context type
export interface AuthContextType {
  // State
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  token: string | null;
  error: AuthError | null;
  
  // Actions
  login: (options?: LoginOptions) => Promise<void>;
  logout: (options?: LogoutOptions) => Promise<void>;
  register: (options?: RegisterOptions) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  
  // Helpers
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  
  // Keycloak instance (for advanced usage)
  keycloak: Keycloak;
}

// Auth store actions
export interface AuthActions {
  setAuthenticated: (authenticated: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AuthError | null) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
  
  // Computed
  updateFromKeycloak: (keycloak: Keycloak) => void;
}

// User roles
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

// Auth events
export type AuthEvent =
  | 'onReady'
  | 'onAuthSuccess'
  | 'onAuthError'
  | 'onAuthRefreshSuccess'
  | 'onAuthRefreshError'
  | 'onAuthLogout'
  | 'onTokenExpired';

export interface AuthEventPayload {
  event: AuthEvent;
  timestamp: number;
  data?: any;
}