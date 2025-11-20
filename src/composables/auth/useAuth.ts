/**
 * useAuth Composable
 *
 * Главный composable для работы с Keycloak авторизацией
 */

import { computed, type ComputedRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { getKeycloak, login as keycloakLogin, logout as keycloakLogout } from '@/plugins/keycloak'
import type { User } from '@/types'

export interface UseAuthReturn {
  // State
  user: ComputedRef<User | null>
  isAuthenticated: ComputedRef<boolean>
  isInitialized: ComputedRef<boolean>
  isLoading: ComputedRef<boolean>
  isLoadingProfile: ComputedRef<boolean>
  userImage: ComputedRef<string | null>
  bannerImage: ComputedRef<string | null>

  // Getters
  userId: ComputedRef<string | null>
  username: ComputedRef<string | null>
  email: ComputedRef<string | null>
  token: ComputedRef<string | null>
  refreshToken: ComputedRef<string | null>
  isAdmin: ComputedRef<boolean>

  // Actions
  login: () => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateProfile: (data: {
    username?: string
    description?: string
    instagram?: string
    tiktok?: string
    telegram?: string
    pinterest?: string
  }) => Promise<User>
  uploadAvatar: (file: File) => Promise<void>
  uploadBanner: (file: File) => Promise<void>
  updateToken: (minValidity?: number) => Promise<boolean | undefined>
}

/**
 * useAuth
 *
 * @example
 * ```ts
 * const {
 *   user,
 *   isAuthenticated,
 *   login,
 *   logout
 * } = useAuth()
 *
 * if (!isAuthenticated.value) {
 *   await login()
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const authStore = useAuthStore()

  // State
  const {
    user,
    isAuthenticated,
    isInitialized,
    loading: isLoading,
    isLoadingProfile,
    userImage,
    bannerImage,
    userId,
    username,
    email,
    token,
    refreshToken,
    isAdmin,
  } = storeToRefs(authStore)

  // Actions
  const login = async (): Promise<void> => {
    try {
      await authStore.login()
    } catch (error) {
      console.error('[useAuth] Login failed:', error)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await authStore.logout()
    } catch (error) {
      console.error('[useAuth] Logout failed:', error)
      throw error
    }
  }

  const checkAuth = async (): Promise<void> => {
    try {
      await authStore.checkAuth()
    } catch (error) {
      console.error('[useAuth] Check auth failed:', error)
      throw error
    }
  }

  const updateProfile = async (data: {
    username?: string
    description?: string
    instagram?: string
    tiktok?: string
    telegram?: string
    pinterest?: string
  }): Promise<User> => {
    try {
      return await authStore.updateProfile(data)
    } catch (error) {
      console.error('[useAuth] Update profile failed:', error)
      throw error
    }
  }

  const uploadAvatar = async (file: File): Promise<void> => {
    try {
      await authStore.uploadAvatar(file)
    } catch (error) {
      console.error('[useAuth] Upload avatar failed:', error)
      throw error
    }
  }

  const uploadBanner = async (file: File): Promise<void> => {
    try {
      await authStore.uploadBanner(file)
    } catch (error) {
      console.error('[useAuth] Upload banner failed:', error)
      throw error
    }
  }

  const updateToken = async (minValidity = 5): Promise<boolean | undefined> => {
    try {
      return await authStore.updateToken(minValidity)
    } catch (error) {
      console.error('[useAuth] Update token failed:', error)
      throw error
    }
  }

  return {
    // State
    user: computed(() => user.value),
    isAuthenticated: computed(() => isAuthenticated.value),
    isInitialized: computed(() => isInitialized.value),
    isLoading: computed(() => isLoading.value),
    isLoadingProfile: computed(() => isLoadingProfile.value),
    userImage: computed(() => userImage.value),
    bannerImage: computed(() => bannerImage.value),

    // Getters
    userId,
    username,
    email,
    token,
    refreshToken,
    isAdmin,

    // Actions
    login,
    logout,
    checkAuth,
    updateProfile,
    uploadAvatar,
    uploadBanner,
    updateToken,
  }
}

/**
 * useKeycloakInstance
 *
 * Прямой доступ к Keycloak instance (для продвинутых случаев)
 *
 * @example
 * ```ts
 * const keycloak = useKeycloakInstance()
 *
 * if (keycloak) {
 *   console.log('Token expires in:', keycloak.tokenParsed?.exp)
 * }
 * ```
 */
export function useKeycloakInstance() {
  return getKeycloak()
}

/**
 * useKeycloakReady
 *
 * Проверка, инициализирован ли Keycloak
 *
 * @example
 * ```ts
 * const isReady = useKeycloakReady()
 *
 * if (isReady.value) {
 *   // Keycloak готов к использованию
 * }
 * ```
 */
export function useKeycloakReady() {
  const authStore = useAuthStore()
  return computed(() => authStore.isInitialized)
}

/**
 * useAuthUser
 *
 * Только user state (для компонентов, которым не нужны actions)
 *
 * @example
 * ```ts
 * const { user, userImage } = useAuthUser()
 * ```
 */
export function useAuthUser() {
  const authStore = useAuthStore()
  const { user, userImage, bannerImage, userId, username, email } = storeToRefs(authStore)

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
 * useAuthState
 *
 * Только authentication state (без user data)
 *
 * @example
 * ```ts
 * const { isAuthenticated, isLoading } = useAuthState()
 * ```
 */
export function useAuthState() {
  const authStore = useAuthStore()
  const { isAuthenticated, isInitialized, loading, isLoadingProfile } = storeToRefs(authStore)

  return {
    isAuthenticated,
    isInitialized,
    isLoading: loading,
    isLoadingProfile,
  }
}
