// src/composables/auth/useAuth.ts
/**
 * useAuth - Authentication composable
 *
 * Объединяет auth.store и user.store в единый интерфейс.
 * Не дублирует - делегирует в stores.
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'
import {
  login as keycloakLogin,
  logout as keycloakLogout,
  refreshToken,
  getKeycloak,
} from '@/plugins/keycloak'

/**
 * useAuth - Основной auth composable
 */
export function useAuth() {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  // Auth state (из auth.store)
  const { isAuthenticated, isInitialized, isInitializing, token, userId } = storeToRefs(authStore)

  // User state (из user.store)
  const {
    currentUser: user,
    avatarBlobUrl: userImage,
    bannerBlobUrl: bannerImage,
    isLoadingProfile,
    username,
    email,
  } = storeToRefs(userStore)

  // Combined loading state
  const isLoading = computed(() => isInitializing.value || isLoadingProfile.value)

  return {
    // ==================== STATE ====================
    user,
    isAuthenticated,
    isInitialized,
    isLoading,
    isLoadingProfile,
    userImage,
    bannerImage,

    // ==================== GETTERS ====================
    userId,
    username,
    email,
    token,

    // Roles (делегируем в auth.store)
    isAdmin: computed(() => authStore.isAdmin),
    isModerator: computed(() => authStore.isModerator),
    hasRole: authStore.hasRole,

    // ==================== ACTIONS ====================

    /**
     * Login через Keycloak
     */
    login: (redirectUri?: string) => keycloakLogin(redirectUri),

    /**
     * Logout через Keycloak
     */
    logout: (redirectUri?: string) => keycloakLogout(redirectUri),

    /**
     * Загрузить профиль текущего пользователя
     */
    loadProfile: () => userStore.loadCurrentUser(),

    /**
     * Обновить профиль
     */
    updateProfile: (data: Parameters<typeof userStore.updateProfile>[0]) =>
      userStore.updateProfile(data),

    /**
     * Загрузить аватар
     */
    uploadAvatar: (file: File) => userStore.uploadAvatar(file),

    /**
     * Загрузить баннер
     */
    uploadBanner: (file: File) => userStore.uploadBanner(file),

    /**
     * Удалить аватар
     */
    removeAvatar: () => userStore.removeAvatar(),

    /**
     * Удалить баннер
     */
    removeBanner: () => userStore.removeBanner(),

    /**
     * Обновить токен
     */
    refreshToken: (minValidity?: number) => refreshToken(minValidity),

    /**
     * Проверить аутентификацию
     */
    checkAuth: () => authStore.checkAuth(),
  }
}

/**
 * useAuthState - Только состояние аутентификации (без user data)
 */
export function useAuthState() {
  const authStore = useAuthStore()
  const { isAuthenticated, isInitialized, isInitializing } = storeToRefs(authStore)

  return {
    isAuthenticated,
    isInitialized,
    isLoading: isInitializing,
  }
}

/**
 * useAuthUser - Только данные пользователя
 */
export function useAuthUser() {
  const userStore = useUserStore()
  const {
    currentUser: user,
    avatarBlobUrl: userImage,
    bannerBlobUrl: bannerImage,
    userId,
    username,
    email,
  } = storeToRefs(userStore)

  return {
    user,
    userImage,
    bannerImage,
    userId,
    username,
    email,
  }
}

/**
 * useKeycloak - Прямой доступ к Keycloak (для продвинутых случаев)
 */
export function useKeycloak() {
  const authStore = useAuthStore()
  const keycloak = getKeycloak()

  return {
    instance: keycloak,
    isReady: computed(() => authStore.isInitialized),
    token: computed(() => authStore.token),
    tokenParsed: computed(() => authStore.tokenParsed),
    refreshToken: computed(() => authStore.refreshToken),
  }
}
