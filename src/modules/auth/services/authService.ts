import Keycloak from 'keycloak-js';
import { keycloak, TOKEN_MIN_VALIDITY } from '@/app/config/keycloak';
import { useAuthStore } from '../stores/authStore';
import type {
  AuthUser,
  AuthError,
  AuthErrorCode,
  LoginOptions,
  LogoutOptions,
  RegisterOptions,
  TokenInfo,
  KeycloakTokenParsed,
  AuthEventPayload,
  AuthEvent,
} from '../types/auth.types';

class AuthService {
  private readonly keycloak: Keycloak;
  private readonly eventListeners: Map<string, Set<(payload: AuthEventPayload) => void>> = new Map();
  private tokenRefreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.keycloak = keycloak;
  }

  // Get Keycloak instance
  getKeycloak(): Keycloak {
    return this.keycloak;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.keycloak.authenticated;
  }

  // Get current token
  getToken(): string | undefined {
    return this.keycloak.token;
  }

  // Get refresh token
  getRefreshToken(): string | undefined {
    return this.keycloak.refreshToken;
  }

  // Get token info
  getTokenInfo(): TokenInfo | null {
    if (!this.keycloak.token || !this.keycloak.refreshToken || !this.keycloak.tokenParsed) {
      return null;
    }

    const tokenParsed = this.keycloak.tokenParsed as KeycloakTokenParsed;
    const refreshTokenParsed = this.keycloak.refreshTokenParsed as KeycloakTokenParsed | undefined;

    return {
      token: this.keycloak.token,
      refreshToken: this.keycloak.refreshToken,
      expiresAt: tokenParsed.exp * 1000,
      refreshExpiresAt: refreshTokenParsed ? refreshTokenParsed.exp * 1000 : 0,
    };
  }

  // Get user from token
  getUser(): AuthUser | null {
    if (!this.keycloak.authenticated || !this.keycloak.tokenParsed) {
      return null;
    }

    const tokenParsed = this.keycloak.tokenParsed as KeycloakTokenParsed;

    return {
      id: tokenParsed.sub,
      username: tokenParsed.preferred_username,
      email: tokenParsed.email,
      emailVerified: tokenParsed.email_verified,
      firstName: tokenParsed.given_name,
      lastName: tokenParsed.family_name,
      roles: tokenParsed.realm_access?.roles || [],
    };
  }

  // Get user ID
  getUserId(): string | null {
    return this.keycloak.tokenParsed?.sub || null;
  }

  // Login
  async login(options?: LoginOptions): Promise<void> {
    try {
      const loginOptions: Parameters<Keycloak['login']>[0] = {
        redirectUri: options?.redirectUri || globalThis.location.origin,
        loginHint: options?.loginHint,
        idpHint: options?.idpHint,
        scope: options?.scope,
        locale: options?.locale,
      };
      
      if (options?.prompt && options.prompt !== 'select_account') {
        loginOptions.prompt = options.prompt;
      }
      
      await this.keycloak.login(loginOptions);
    } catch (error) {
      this.handleError('LOGIN_FAILED', 'Failed to initiate login', error);
      throw error;
    }
  }

  // Logout
  async logout(options?: LogoutOptions): Promise<void> {
    try {
      this.stopTokenRefresh();
      await this.keycloak.logout({
        redirectUri: options?.redirectUri || globalThis.location.origin,
      });
      useAuthStore.getState().reset();
    } catch (error) {
      this.handleError('LOGOUT_FAILED', 'Failed to logout', error);
      throw error;
    }
  }

  // Register
  async register(options?: RegisterOptions): Promise<void> {
    try {
      await this.keycloak.register({
        redirectUri: options?.redirectUri || globalThis.location.origin,
        locale: options?.locale,
      });
    } catch (error) {
      this.handleError('LOGIN_FAILED', 'Failed to initiate registration', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(minValidity: number = TOKEN_MIN_VALIDITY): Promise<boolean> {
    try {
      const refreshed = await this.keycloak.updateToken(minValidity);
      
      if (refreshed) {
        useAuthStore.getState().updateFromKeycloak(this.keycloak);
        this.emitEvent('onAuthRefreshSuccess');
      }
      
      return true;
    } catch (error) {
      this.handleError('TOKEN_REFRESH_FAILED', 'Failed to refresh token', error);
      this.emitEvent('onAuthRefreshError', { error });
      return false;
    }
  }

  // Force refresh token
  async forceRefreshToken(): Promise<boolean> {
    return this.refreshToken(-1);
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    return this.keycloak.isTokenExpired(0);
  }

  // Check if token will expire soon
  isTokenExpiringSoon(minValidity: number = TOKEN_MIN_VALIDITY): boolean {
    return this.keycloak.isTokenExpired(minValidity);
  }

  // Start automatic token refresh
  startTokenRefresh(intervalMs: number = 10000): void {
    if (this.tokenRefreshInterval) {
      return;
    }

    this.tokenRefreshInterval = setInterval(async () => {
      if (this.keycloak.authenticated && this.isTokenExpiringSoon()) {
        await this.refreshToken();
      }
    }, intervalMs);
  }

  // Stop automatic token refresh
  stopTokenRefresh(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  // Check if user has role
  hasRole(role: string): boolean {
    return this.keycloak.hasRealmRole(role);
  }

  // Check if user has any of the roles
  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  // Check if user has all of the roles
  hasAllRoles(roles: string[]): boolean {
    return roles.every(role => this.hasRole(role));
  }

  // Check if user has resource role
  hasResourceRole(role: string, resource: string): boolean {
    return this.keycloak.hasResourceRole(role, resource);
  }

  // Get account management URL
  getAccountUrl(): string | undefined {
    return this.keycloak.createAccountUrl();
  }

  // Open account management
  async openAccountManagement(): Promise<void> {
    await this.keycloak.accountManagement();
  }

  // Subscribe to auth events
  on(event: AuthEvent, callback: (payload: AuthEventPayload) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  // Emit event
  private emitEvent(event: AuthEvent, data?: unknown): void {
    const payload: AuthEventPayload = {
      event,
      timestamp: Date.now(),
      data,
    };

    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error('Error in auth event listener:', error);
      }
    });
  }

  // Handle error
  private handleError(code: AuthErrorCode, message: string, originalError?: unknown): void {
    const error: AuthError = {
      code,
      message,
      details: originalError instanceof Error ? originalError.message : String(originalError),
    };

    useAuthStore.getState().setError(error);
    console.error(`[AuthService] ${code}: ${message}`, originalError);
  }

  // Setup Keycloak event handlers
  setupEventHandlers(): void {
    this.keycloak.onReady = (authenticated) => {
      useAuthStore.getState().updateFromKeycloak(this.keycloak);
      this.emitEvent('onReady', { authenticated });
      
      if (authenticated) {
        this.startTokenRefresh();
      }
    };

    this.keycloak.onAuthSuccess = () => {
      useAuthStore.getState().updateFromKeycloak(this.keycloak);
      this.emitEvent('onAuthSuccess');
      this.startTokenRefresh();
    };

    this.keycloak.onAuthError = (error) => {
      this.handleError('LOGIN_FAILED', 'Authentication failed', error);
      this.emitEvent('onAuthError', { error });
    };

    this.keycloak.onAuthRefreshSuccess = () => {
      useAuthStore.getState().updateFromKeycloak(this.keycloak);
      this.emitEvent('onAuthRefreshSuccess');
    };

    this.keycloak.onAuthRefreshError = () => {
      this.handleError('TOKEN_REFRESH_FAILED', 'Token refresh failed');
      this.emitEvent('onAuthRefreshError');
    };

    this.keycloak.onAuthLogout = () => {
      this.stopTokenRefresh();
      useAuthStore.getState().reset();
      this.emitEvent('onAuthLogout');
    };

    this.keycloak.onTokenExpired = () => {
      this.emitEvent('onTokenExpired');
      this.refreshToken();
    };
  }
}

// Singleton instance
export const authService = new AuthService();

export default authService;