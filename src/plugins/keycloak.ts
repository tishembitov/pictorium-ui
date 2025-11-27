// frontend/src/plugins/keycloak.ts
import type { App } from 'vue'
import Keycloak from 'keycloak-js'
import { useAuthStore } from '@/stores/auth.store'

let keycloakInstance: Keycloak | null = null

// Получить текущий язык приложения
function getCurrentLocale(): string {
  // Из localStorage, i18n, или navigator
  return localStorage.getItem('locale') || navigator.language.split('-')[0] || 'en'
}

// Получить текущую тему (light/dark)
function getCurrentTheme(): string {
  return (
    localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
}

export async function setupKeycloak(app: App): Promise<boolean> {
  const config = {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'pictorium',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'pictorium-app',
  }

  keycloakInstance = new Keycloak(config)

  try {
    const authenticated = await keycloakInstance.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      pkceMethod: 'S256',
      checkLoginIframe: false,
      enableLogging: import.meta.env.DEV,
    })

    // Инициализируем store
    const authStore = useAuthStore()
    authStore.initKeycloak(keycloakInstance)

    // Provide для использования в компонентах
    app.config.globalProperties.$keycloak = keycloakInstance
    app.provide('keycloak', keycloakInstance)

    // Автообновление токена
    setupTokenRefresh(keycloakInstance)

    // Слушаем события
    setupEventListeners(keycloakInstance)

    console.log('[Keycloak] Initialized:', { authenticated })
    return authenticated
  } catch (error) {
    console.error('[Keycloak] Init failed:', error)
    throw error
  }
}

function setupTokenRefresh(keycloak: Keycloak): void {
  setInterval(() => {
    keycloak.updateToken(70).catch(() => {
      console.warn('[Keycloak] Token refresh failed, session may have expired')
    })
  }, 30000)
}

function setupEventListeners(keycloak: Keycloak): void {
  keycloak.onTokenExpired = () => {
    console.log('[Keycloak] Token expired, refreshing...')
    keycloak.updateToken(5).catch(() => {
      console.warn('[Keycloak] Failed to refresh expired token')
    })
  }

  keycloak.onAuthLogout = () => {
    console.log('[Keycloak] User logged out')
    const authStore = useAuthStore()
    authStore.updateAuthState(false)
  }

  keycloak.onAuthRefreshError = () => {
    console.error('[Keycloak] Auth refresh error')
  }
}

export function getKeycloak(): Keycloak | null {
  return keycloakInstance
}

/**
 * Login с дополнительными параметрами
 */
export interface LoginOptions {
  redirectUri?: string
  locale?: string
  loginHint?: string // Pre-fill email/username
  idpHint?: string // Сразу перейти на Google/GitHub
}

export function login(options: LoginOptions = {}): void {
  if (!keycloakInstance) {
    console.warn('[Keycloak] Not initialized')
    return
  }

  const locale = options.locale || getCurrentLocale()

  keycloakInstance.login({
    redirectUri: options.redirectUri || window.location.origin,
    locale,
    loginHint: options.loginHint,
    idpHint: options.idpHint,
  })
}

/**
 * Register с параметрами
 */
export interface RegisterOptions {
  redirectUri?: string
  locale?: string
  loginHint?: string
}

export function register(options: RegisterOptions = {}): void {
  if (!keycloakInstance) {
    console.warn('[Keycloak] Not initialized')
    return
  }

  const locale = options.locale || getCurrentLocale()

  keycloakInstance.register({
    redirectUri: options.redirectUri || window.location.origin,
    locale,
    loginHint: options.loginHint,
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
 * Прямой вход через провайдер (Google, GitHub)
 */
export function loginWithProvider(provider: 'google' | 'github', redirectUri?: string): void {
  login({
    idpHint: provider,
    redirectUri,
  })
}

/**
 * Получить URL для логина (для href в ссылках)
 */
export function getLoginUrl(options: LoginOptions = {}): string {
  if (!keycloakInstance) return '#'

  return keycloakInstance.createLoginUrl({
    redirectUri: options.redirectUri || window.location.origin,
    locale: options.locale || getCurrentLocale(),
    loginHint: options.loginHint,
    idpHint: options.idpHint,
  })
}

/**
 * Получить URL для регистрации
 */
export function getRegisterUrl(options: RegisterOptions = {}): string {
  if (!keycloakInstance) return '#'

  return keycloakInstance.createRegisterUrl({
    redirectUri: options.redirectUri || window.location.origin,
    locale: options.locale || getCurrentLocale(),
  })
}

// Экспорт остальных функций...
export function getToken(): string | undefined {
  return keycloakInstance?.token
}

export function isAuthenticated(): boolean {
  return keycloakInstance?.authenticated ?? false
}

export function accountManagement(): void {
  keycloakInstance?.accountManagement()
}
