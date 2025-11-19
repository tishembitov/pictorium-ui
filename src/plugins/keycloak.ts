import { App } from 'vue'
import Keycloak from 'keycloak-js'
import { useAuthStore } from '@/stores/auth.store'

export let keycloak: Keycloak | null = null

export async function setupKeycloak(app: App) {
  keycloak = new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'pinterest-clone',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'vue-app',
  })

  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    })

    // Глобальный доступ к Keycloak
    app.config.globalProperties.$keycloak = keycloak
    app.provide('keycloak', keycloak)

    if (authenticated) {
      const authStore = useAuthStore()
      await authStore.initKeycloak(keycloak) // Исправлено
    }

    // Обновление токена каждые 30 секунд
    setInterval(() => {
      keycloak?.updateToken(70).catch(() => {
        console.error('Failed to refresh token')
      })
    }, 30000)

    return authenticated
  } catch (error) {
    console.error('Failed to initialize Keycloak:', error)
    throw error
  }
}

export function getKeycloak(): Keycloak | null {
  return keycloak
}

// ... остальной код без изменений

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Получить access token
 */
export function getToken(): string | undefined {
  return keycloak?.token
}

/**
 * Получить refresh token
 */
export function getRefreshToken(): string | undefined {
  return keycloak?.refreshToken
}

/**
 * Получить ID token
 */
export function getIdToken(): string | undefined {
  return keycloak?.idToken
}

/**
 * Проверить аутентификацию
 */
export function isAuthenticated(): boolean {
  return keycloak?.authenticated ?? false
}

/**
 * Войти
 */
export function login(redirectUri?: string): void {
  if (!keycloak) {
    console.error('[Keycloak] Keycloak is not initialized')
    return
  }

  keycloak.login({
    redirectUri: redirectUri || import.meta.env.VITE_KEYCLOAK_REDIRECT_URI,
  })
}

/**
 * Выйти
 */
export function logout(redirectUri?: string): void {
  if (!keycloak) {
    console.error('[Keycloak] Keycloak is not initialized')
    return
  }

  keycloak.logout({
    redirectUri: redirectUri || import.meta.env.VITE_KEYCLOAK_REDIRECT_URI,
  })
}

/**
 * Обновить токен
 */
export async function refreshToken(minValidity: number = 5): Promise<boolean> {
  if (!keycloak) {
    console.error('[Keycloak] Keycloak is not initialized')
    return false
  }

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
  if (!keycloak) {
    console.error('[Keycloak] Keycloak is not initialized')
    return null
  }

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
  if (!keycloak) {
    console.warn('[Keycloak] Keycloak is not initialized')
    return false
  }
  return keycloak.hasRealmRole(role)
}

/**
 * Проверить роли
 */
export function hasRoles(roles: string[]): boolean {
  if (!keycloak) {
    console.warn('[Keycloak] Keycloak is not initialized')
    return false
  }
  return roles.every((role) => keycloak!.hasRealmRole(role))
}
