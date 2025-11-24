// src/plugins/keycloak.ts
import type { App } from 'vue'
import Keycloak from 'keycloak-js'

/**
 * Singleton для хранения экземпляра Keycloak
 * Использует замыкание вместо мутируемого export
 */
let keycloakInstance: Keycloak | null = null

export async function setupKeycloak(app: App): Promise<boolean> {
  // Создаем новый экземпляр только если его еще нет
  keycloakInstance ??= new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'pinterest-clone',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'vue-app',
  })

  try {
    const authenticated = await keycloakInstance.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
      checkLoginIframe: false,
      enableLogging: import.meta.env.DEV,
    })

    // Глобальный доступ
    app.config.globalProperties.$keycloak = keycloakInstance
    app.provide('keycloak', keycloakInstance)

    // Автообновление токена
    setupTokenRefresh(keycloakInstance)

    console.log('[Keycloak] Initialized successfully:', { authenticated })

    return authenticated
  } catch (error) {
    console.error('[Keycloak] Failed to initialize:', error)
    throw error
  }
}

/**
 * Получить экземпляр Keycloak (read-only)
 */
export function getKeycloak(): Keycloak | null {
  return keycloakInstance
}

/**
 * Настройка автообновления токена
 */
function setupTokenRefresh(keycloak: Keycloak): void {
  // Обновляем токен каждые 30 секунд (если до истечения осталось < 70 сек)
  const intervalId = setInterval(() => {
    keycloak
      .updateToken(70)
      .then((refreshed) => {
        if (refreshed) {
          console.log('[Keycloak] Token refreshed')
        }
      })
      .catch((error) => {
        console.error('[Keycloak] Failed to refresh token:', error)
        clearInterval(intervalId)
      })
  }, 30000)

  // Очистка при выходе
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      clearInterval(intervalId)
    })
  }
}

/**
 * Очистка (для тестов и HMR)
 */
export function resetKeycloak(): void {
  keycloakInstance = null
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Получить access token
 */
export function getToken(): string | undefined {
  return keycloakInstance?.token
}

/**
 * Получить refresh token
 */
export function getRefreshToken(): string | undefined {
  return keycloakInstance?.refreshToken
}

/**
 * Получить ID token
 */
export function getIdToken(): string | undefined {
  return keycloakInstance?.idToken
}

/**
 * Проверка аутентификации
 */
export function isAuthenticated(): boolean {
  return keycloakInstance?.authenticated ?? false
}

/**
 * Login
 */
export function login(redirectUri?: string): void {
  if (!keycloakInstance) {
    console.warn('[Keycloak] Not initialized')
    return
  }

  keycloakInstance.login({
    redirectUri: redirectUri || window.location.origin,
  })
}

/**
 * Logout
 */
export function logout(redirectUri?: string): void {
  if (!keycloakInstance) {
    console.warn('[Keycloak] Not initialized')
    return
  }

  keycloakInstance.logout({
    redirectUri: redirectUri || window.location.origin,
  })
}

/**
 * Refresh token
 */
export async function refreshToken(minValidity: number = 5): Promise<boolean> {
  if (!keycloakInstance) {
    console.warn('[Keycloak] Not initialized')
    return false
  }

  try {
    return await keycloakInstance.updateToken(minValidity)
  } catch (error) {
    console.error('[Keycloak] Token refresh failed:', error)
    return false
  }
}

/**
 * Load user profile
 */
export async function loadUserProfile() {
  if (!keycloakInstance) {
    console.warn('[Keycloak] Not initialized')
    return null
  }

  try {
    return await keycloakInstance.loadUserProfile()
  } catch (error) {
    console.error('[Keycloak] Failed to load profile:', error)
    return null
  }
}

/**
 * Check if user has role
 */
export function hasRole(role: string): boolean {
  if (!keycloakInstance) return false
  return keycloakInstance.hasRealmRole(role)
}

/**
 * Check if user has resource role
 */
export function hasResourceRole(role: string, resource: string): boolean {
  if (!keycloakInstance) return false
  return keycloakInstance.hasResourceRole(role, resource)
}

/**
 * Get user info from token
 */
export function getUserInfo() {
  return keycloakInstance?.tokenParsed
}

/**
 * Register new user
 */
export function register(redirectUri?: string): void {
  if (!keycloakInstance) {
    console.warn('[Keycloak] Not initialized')
    return
  }

  keycloakInstance.register({
    redirectUri: redirectUri || window.location.origin,
  })
}

/**
 * Account management
 */
export function accountManagement(): void {
  if (!keycloakInstance) {
    console.warn('[Keycloak] Not initialized')
    return
  }

  keycloakInstance.accountManagement()
}
