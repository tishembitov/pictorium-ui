/**
 * Keycloak Plugin для Vue
 */

import Keycloak, { type KeycloakConfig, type KeycloakInitOptions } from 'keycloak-js'
import type { App } from 'vue'

// ============================================================================
// CONFIGURATION
// ============================================================================

const keycloakConfig: KeycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
}

const initOptions: KeycloakInitOptions = {
  onLoad: 'check-sso',
  pkceMethod: 'S256',
  checkLoginIframe: import.meta.env.VITE_KEYCLOAK_CHECK_LOGIN_IFRAME === 'true',
  enableLogging: import.meta.env.VITE_KEYCLOAK_ENABLE_LOGGING === 'true',
}

// ============================================================================
// KEYCLOAK INSTANCE
// ============================================================================

export const keycloak = new Keycloak(keycloakConfig)

// ============================================================================
// PLUGIN
// ============================================================================

export default {
  install: async (app: App) => {
    try {
      // Инициализация Keycloak
      const authenticated = await keycloak.init(initOptions)

      console.log('[Keycloak] Initialized:', authenticated)

      // Добавление в Vue global properties
      app.config.globalProperties.$keycloak = keycloak

      // Auto-refresh token
      if (authenticated) {
        setInterval(() => {
          keycloak.updateToken(70).catch(() => {
            console.error('[Keycloak] Failed to refresh token')
          })
        }, 60000) // Каждую минуту проверяем токен
      }
    } catch (error) {
      console.error('[Keycloak] Initialization failed:', error)
    }
  },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Получить access token
 */
export function getToken(): string | undefined {
  return keycloak.token
}

/**
 * Получить refresh token
 */
export function getRefreshToken(): string | undefined {
  return keycloak.refreshToken
}

/**
 * Получить ID token
 */
export function getIdToken(): string | undefined {
  return keycloak.idToken
}

/**
 * Проверить аутентификацию
 */
export function isAuthenticated(): boolean {
  return keycloak.authenticated ?? false
}

/**
 * Войти
 */
export function login(redirectUri?: string): void {
  keycloak.login({
    redirectUri: redirectUri || import.meta.env.VITE_KEYCLOAK_REDIRECT_URI,
  })
}

/**
 * Выйти
 */
export function logout(redirectUri?: string): void {
  keycloak.logout({
    redirectUri: redirectUri || import.meta.env.VITE_KEYCLOAK_REDIRECT_URI,
  })
}

/**
 * Обновить токен
 */
export async function refreshToken(minValidity: number = 5): Promise<boolean> {
  try {
    return await keycloak.updateToken(minValidity)
  } catch (error) {
    console.error('[Keycloak] Token refresh failed:', error)
    return false
  }
}

/**
 * Получить информацию о пользователе
 */
export async function loadUserProfile() {
  try {
    return await keycloak.loadUserProfile()
  } catch (error) {
    console.error('[Keycloak] Failed to load user profile:', error)
    return null
  }
}

/**
 * Проверить роль
 */
export function hasRole(role: string): boolean {
  return keycloak.hasRealmRole(role)
}

/**
 * Проверить роли
 */
export function hasRoles(roles: string[]): boolean {
  return roles.every((role) => keycloak.hasRealmRole(role))
}
