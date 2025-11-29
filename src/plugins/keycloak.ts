// src/plugins/keycloak.ts
import type { App } from 'vue'
import Keycloak from 'keycloak-js'
import { useAuthStore } from '@/stores/auth.store'
import { KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID } from '@/utils/constants'

let keycloakInstance: Keycloak | null = null

// Получить текущий язык приложения
function getCurrentLocale(): string {
  return localStorage.getItem('locale') || navigator.language.split('-')[0] || 'en'
}

export async function setupKeycloak(app: App): Promise<boolean> {
  const config = {
    url: KEYCLOAK_URL,
    realm: KEYCLOAK_REALM,
    clientId: KEYCLOAK_CLIENT_ID,
  }

  console.log('[Keycloak] Initializing with config:', {
    url: config.url,
    realm: config.realm,
    clientId: config.clientId,
  })

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

export async function refreshToken(minValidity: number = 30): Promise<boolean> {
  if (!keycloakInstance) {
    console.warn('[Keycloak] Not initialized')
    return false
  }

  if (!keycloakInstance.authenticated) {
    console.warn('[Keycloak] User not authenticated')
    return false
  }

  try {
    const refreshed = await keycloakInstance.updateToken(minValidity)

    if (refreshed && import.meta.env.DEV) {
      console.log('[Keycloak] Token refreshed successfully')
    }

    return true // Токен валиден (либо обновлён, либо ещё не истёк)
  } catch (error) {
    console.error('[Keycloak] Token refresh failed:', error)
    return false
  }
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
  loginHint?: string
  idpHint?: string
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
 * Получить URL для логина (асинхронная версия)
 */
export async function getLoginUrl(options: LoginOptions = {}): Promise<string> {
  if (!keycloakInstance) return '#'

  return keycloakInstance.createLoginUrl({
    redirectUri: options.redirectUri || window.location.origin,
    locale: options.locale || getCurrentLocale(),
    loginHint: options.loginHint,
    idpHint: options.idpHint,
  })
}

/**
 * Получить URL для регистрации (асинхронная версия)
 */
export async function getRegisterUrl(options: RegisterOptions = {}): Promise<string> {
  if (!keycloakInstance) return '#'

  return keycloakInstance.createRegisterUrl({
    redirectUri: options.redirectUri || window.location.origin,
    locale: options.locale || getCurrentLocale(),
  })
}

/**
 * Синхронная версия для использования в href
 * Использует сохранённые параметры или возвращает заглушку
 */
export function getLoginUrlSync(options: LoginOptions = {}): string {
  if (!keycloakInstance) return '#'

  // Формируем URL вручную для синхронного использования
  const baseUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: options.redirectUri || window.location.origin,
    response_type: 'code',
    scope: 'openid profile email',
  })

  if (options.locale) {
    params.append('ui_locales', options.locale)
  }
  if (options.loginHint) {
    params.append('login_hint', options.loginHint)
  }
  if (options.idpHint) {
    params.append('kc_idp_hint', options.idpHint)
  }

  return `${baseUrl}?${params.toString()}`
}

/**
 * Синхронная версия URL для регистрации
 */
export function getRegisterUrlSync(options: RegisterOptions = {}): string {
  const loginUrl = getLoginUrlSync(options)
  // Добавляем параметр для показа формы регистрации
  const url = new URL(loginUrl)
  url.searchParams.set('kc_action', 'register')
  return url.toString()
}

export function getToken(): string | undefined {
  return keycloakInstance?.token
}

export function isAuthenticated(): boolean {
  return keycloakInstance?.authenticated ?? false
}

export function accountManagement(): void {
  keycloakInstance?.accountManagement()
}
