// frontend/src/composables/auth/useAuth.ts
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useI18n } from 'vue-i18n' // если используете i18n
import {
  login as keycloakLogin,
  logout as keycloakLogout,
  register as keycloakRegister,
  loginWithProvider,
  getLoginUrl,
  getRegisterUrl,
  accountManagement,
  type LoginOptions,
  type RegisterOptions,
} from '@/plugins/keycloak'

export function useAuth() {
  const authStore = useAuthStore()
  // const { locale } = useI18n() // если используете i18n

  // Loading states для UI
  const isLoggingIn = ref(false)
  const isLoggingOut = ref(false)
  const isRegistering = ref(false)

  /**
   * Войти
   */
  function login(options: LoginOptions = {}) {
    isLoggingIn.value = true

    // Добавляем текущий URL как redirect
    const redirectUri = options.redirectUri || window.location.href

    keycloakLogin({
      ...options,
      redirectUri,
      // locale: locale.value, // если i18n
    })

    // isLoggingIn останется true до редиректа
  }

  /**
   * Выйти
   */
  function logout(redirectUri?: string) {
    isLoggingOut.value = true
    keycloakLogout(redirectUri || window.location.origin)
  }

  /**
   * Регистрация
   */
  function register(options: RegisterOptions = {}) {
    isRegistering.value = true

    keycloakRegister({
      ...options,
      redirectUri: options.redirectUri || window.location.origin,
    })
  }

  /**
   * Войти через Google
   */
  function loginWithGoogle(redirectUri?: string) {
    isLoggingIn.value = true
    loginWithProvider('google', redirectUri || window.location.href)
  }

  /**
   * Войти через GitHub
   */
  function loginWithGitHub(redirectUri?: string) {
    isLoggingIn.value = true
    loginWithProvider('github', redirectUri || window.location.href)
  }

  /**
   * Открыть настройки аккаунта в Keycloak
   */
  function openAccountSettings() {
    accountManagement()
  }

  /**
   * Получить return URL (куда вернуть после логина)
   */
  function getReturnUrl(): string {
    // Проверяем query параметр
    const urlParams = new URLSearchParams(window.location.search)
    const returnTo = urlParams.get('returnTo')

    if (returnTo) {
      // Валидируем что это наш домен
      try {
        const url = new URL(returnTo, window.location.origin)
        if (url.origin === window.location.origin) {
          return returnTo
        }
      } catch {
        // Invalid URL
      }
    }

    return window.location.href
  }

  return {
    // State (readonly)
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isInitialized: computed(() => authStore.isInitialized),
    isInitializing: computed(() => authStore.isInitializing),

    // Loading states
    isLoggingIn: computed(() => isLoggingIn.value),
    isLoggingOut: computed(() => isLoggingOut.value),
    isRegistering: computed(() => isRegistering.value),

    // User info
    userId: computed(() => authStore.userId),
    email: computed(() => authStore.userEmail),
    username: computed(() => authStore.preferredUsername),

    // Actions
    login,
    logout,
    register,
    loginWithGoogle,
    loginWithGitHub,
    openAccountSettings,

    // Helpers
    getLoginUrl,
    getRegisterUrl,
    getReturnUrl,
  }
}
