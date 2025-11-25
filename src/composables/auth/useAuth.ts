// src/composables/auth/useAuth.ts
/**
 * useAuth - Authentication composable
 *
 * ТОЛЬКО аутентификация. Профиль пользователя - в useCurrentUser.
 * Не дублирует - делегирует в auth.store и plugins/keycloak.
 */

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import {
  login,
  logout,
  register,
  refreshToken,
  accountManagement,
  isAuthenticated as checkIsAuthenticated,
  getToken,
} from '@/plugins/keycloak'

/**
 * useAuth - Основной auth composable
 *
 * Использование:
 * ```ts
 * const { isAuthenticated, login, logout } = useAuth()
 *
 * if (!isAuthenticated.value) {
 *   login()
 * }
 * ```
 */
export function useAuth() {
  const authStore = useAuthStore()

  return {
    // ==================== STATE ====================
    /** Пользователь аутентифицирован */
    isAuthenticated: computed(() => authStore.isAuthenticated),

    /** Keycloak инициализирован */
    isInitialized: computed(() => authStore.isInitialized),

    /** Идёт инициализация */
    isInitializing: computed(() => authStore.isInitializing),

    // ==================== TOKEN ====================
    /** Access token (для API вызовов - обычно не нужен напрямую) */
    token: computed(() => authStore.token),

    /** User ID из токена */
    userId: computed(() => authStore.userId),

    /** Email из токена */
    email: computed(() => authStore.userEmail),

    /** Username из токена */
    preferredUsername: computed(() => authStore.preferredUsername),

    // ==================== ACTIONS ====================
    /**
     * Войти через Keycloak
     * @param redirectUri - URL для редиректа после логина
     */
    login: (redirectUri?: string) => login(redirectUri),

    /**
     * Выйти
     * @param redirectUri - URL для редиректа после логаута
     */
    logout: (redirectUri?: string) => logout(redirectUri),

    /**
     * Регистрация нового пользователя
     * @param redirectUri - URL для редиректа после регистрации
     */
    register: (redirectUri?: string) => register(redirectUri),

    /**
     * Открыть страницу управления аккаунтом Keycloak
     */
    openAccountManagement: () => accountManagement(),

    /**
     * Обновить токен
     * @param minValidity - минимальное время валидности в секундах
     */
    refreshToken: (minValidity?: number) => refreshToken(minValidity),

    /**
     * Проверить аутентификацию (sync)
     */
    checkAuth: () => authStore.checkAuth(),
  }
}

/**
 * useAuthState - Минимальное состояние (для guards, layouts)
 *
 * Использование в router guard:
 * ```ts
 * const { isAuthenticated, isInitialized } = useAuthState()
 * ```
 */
export function useAuthState() {
  const authStore = useAuthStore()

  return {
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isInitialized: computed(() => authStore.isInitialized),
    isLoading: computed(() => authStore.isInitializing),
    userId: computed(() => authStore.userId),
  }
}

/**
 * useRequireAuth - Для страниц требующих аутентификации
 *
 * Использование:
 * ```ts
 * const { isReady, redirectToLogin } = useRequireAuth()
 *
 * watchEffect(() => {
 *   if (isReady.value && !isAuthenticated.value) {
 *     redirectToLogin()
 *   }
 * })
 * ```
 */
export function useRequireAuth() {
  const { isAuthenticated, isInitialized, login } = useAuth()

  return {
    isAuthenticated,
    isReady: isInitialized,
    redirectToLogin: (returnUrl?: string) => {
      const redirectUri = returnUrl || window.location.href
      login(redirectUri)
    },
  }
}
