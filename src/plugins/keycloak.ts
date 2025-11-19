import type { App } from 'vue'
import Keycloak from 'keycloak-js'

// Экспортируем переменную, но инициализируем её внутри setup
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

// ... (Остальные helper functions: getToken, login, logout и т.д. оставляем без изменений)

/**
 * Получить access token
 */
export function getToken(): string | undefined {
  return keycloak?.token
}

export function getRefreshToken(): string | undefined {
  return keycloak?.refreshToken
}

export function getIdToken(): string | undefined {
  return keycloak?.idToken
}

export function isAuthenticated(): boolean {
  return keycloak?.authenticated ?? false
}

export function login(redirectUri?: string): void {
  if (!keycloak) return
  keycloak.login({
    redirectUri:
      redirectUri || import.meta.env.VITE_KEYCLOAK_REDIRECT_URI || window.location.origin,
  })
}

export function logout(redirectUri?: string): void {
  if (!keycloak) return
  keycloak.logout({
    redirectUri:
      redirectUri || import.meta.env.VITE_KEYCLOAK_REDIRECT_URI || window.location.origin,
  })
}

export async function refreshToken(minValidity: number = 5): Promise<boolean> {
  if (!keycloak) return false
  try {
    return await keycloak.updateToken(minValidity)
  } catch (error) {
    return false
  }
}

export async function loadUserProfile() {
  if (!keycloak) return null
  return await keycloak.loadUserProfile()
}

export function hasRole(role: string): boolean {
  if (!keycloak) return false
  return keycloak.hasRealmRole(role)
}
