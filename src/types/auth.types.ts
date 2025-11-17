/**
 * Типы для аутентификации (Keycloak)
 */

import type Keycloak from 'keycloak-js'

// ============================================================================
// KEYCLOAK TYPES
// ============================================================================

export interface KeycloakConfig {
  url: string
  realm: string
  clientId: string
}

export interface KeycloakInitOptions {
  onLoad?: 'login-required' | 'check-sso'
  silentCheckSsoRedirectUri?: string
  pkceMethod?: 'S256'
  checkLoginIframe?: boolean
  enableLogging?: boolean
}

export interface KeycloakTokens {
  token: string
  refreshToken: string
  idToken: string
}

export interface KeycloakUser {
  sub: string // User ID
  email?: string
  email_verified?: boolean
  name?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  picture?: string
  locale?: string
  realm_access?: {
    roles: string[]
  }
  resource_access?: Record<string, { roles: string[] }>
}

// ============================================================================
// AUTH STATE
// ============================================================================

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: KeycloakUser | null
  token: string | null
  refreshToken: string | null
  idToken: string | null
  error: string | null
}

export type KeycloakInstance = Keycloak
