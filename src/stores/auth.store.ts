// src/stores/auth.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type Keycloak from 'keycloak-js'

export const useAuthStore = defineStore('auth', () => {
  // ============ STATE ============

  const keycloak = ref<Keycloak | null>(null)
  const isAuthenticated = ref(false)
  const isInitialized = ref(false)
  const isInitializing = ref(false)

  // ============ GETTERS ============

  const token = computed(() => keycloak.value?.token || null)
  const refreshToken = computed(() => keycloak.value?.refreshToken || null)
  const idToken = computed(() => keycloak.value?.idToken || null)

  const tokenParsed = computed(() => keycloak.value?.tokenParsed || null)
  const userId = computed(() => tokenParsed.value?.sub || null)
  const userEmail = computed(() => tokenParsed.value?.email || null)
  const preferredUsername = computed(() => tokenParsed.value?.preferred_username || null)

  const hasRole = computed(() => (role: string) => {
    return keycloak.value?.hasRealmRole(role) || false
  })

  const hasRealmRole = computed(() => (role: string) => {
    return keycloak.value?.hasRealmRole(role) || false
  })

  const hasResourceRole = computed(() => (role: string, resource: string) => {
    return keycloak.value?.hasResourceRole(role, resource) || false
  })

  const isAdmin = computed(() => hasRole.value('admin'))
  const isModerator = computed(() => hasRole.value('moderator'))

  const realmAccess = computed(() => tokenParsed.value?.realm_access || null)
  const resourceAccess = computed(() => tokenParsed.value?.resource_access || null)

  const allRoles = computed(() => {
    const roles: string[] = []

    // Realm roles
    if (realmAccess.value?.roles) {
      roles.push(...realmAccess.value.roles)
    }

    // Resource roles
    if (resourceAccess.value) {
      Object.values(resourceAccess.value).forEach((resource: any) => {
        if (resource.roles) {
          roles.push(...resource.roles)
        }
      })
    }

    return [...new Set(roles)] // Remove duplicates
  })

  // ============ ACTIONS ============

  /**
   * Инициализация Keycloak
   */
  async function initKeycloak(keycloakInstance: Keycloak) {
    try {
      isInitializing.value = true
      keycloak.value = keycloakInstance
      isAuthenticated.value = keycloakInstance.authenticated || false
      isInitialized.value = true

      console.log('[Auth] Keycloak initialized:', {
        authenticated: isAuthenticated.value,
        userId: userId.value,
        roles: allRoles.value,
      })
    } catch (error) {
      console.error('[Auth] Failed to initialize Keycloak:', error)
      throw error
    } finally {
      isInitializing.value = false
    }
  }

  /**
   * Login через Keycloak
   */
  async function login(redirectUri?: string) {
    try {
      if (!keycloak.value) {
        throw new Error('Keycloak not initialized')
      }

      await keycloak.value.login({
        redirectUri: redirectUri || window.location.origin,
      })
    } catch (error) {
      console.error('[Auth] Login failed:', error)
      throw error
    }
  }

  /**
   * Logout
   */
  async function logout(redirectUri?: string) {
    try {
      if (!keycloak.value) {
        throw new Error('Keycloak not initialized')
      }

      // Сбрасываем state
      isAuthenticated.value = false

      // Выходим из Keycloak
      await keycloak.value.logout({
        redirectUri: redirectUri || window.location.origin,
      })
    } catch (error) {
      console.error('[Auth] Logout failed:', error)
      throw error
    }
  }

  /**
   * Обновление токена
   */
  async function updateToken(minValidity = 5): Promise<boolean> {
    try {
      if (!keycloak.value) {
        console.warn('[Auth] Keycloak not initialized')
        return false
      }

      const refreshed = await keycloak.value.updateToken(minValidity)

      if (refreshed) {
        console.log('[Auth] Token refreshed successfully')
      }

      return refreshed
    } catch (error) {
      console.error('[Auth] Token update failed:', error)
      // Если не удалось обновить токен - разлогиниваем
      await logout()
      throw error
    }
  }

  /**
   * Проверка валидности токена
   */
  function isTokenExpired(): boolean {
    if (!keycloak.value) return true
    return keycloak.value.isTokenExpired()
  }

  /**
   * Загрузка профиля из Keycloak
   */
  async function loadKeycloakProfile() {
    try {
      if (!keycloak.value) {
        throw new Error('Keycloak not initialized')
      }

      const profile = await keycloak.value.loadUserProfile()
      console.log('[Auth] Keycloak profile loaded:', profile)
      return profile
    } catch (error) {
      console.error('[Auth] Failed to load Keycloak profile:', error)
      throw error
    }
  }

  /**
   * Регистрация нового пользователя
   */
  async function register(redirectUri?: string) {
    try {
      if (!keycloak.value) {
        throw new Error('Keycloak not initialized')
      }

      await keycloak.value.register({
        redirectUri: redirectUri || window.location.origin,
      })
    } catch (error) {
      console.error('[Auth] Registration failed:', error)
      throw error
    }
  }

  /**
   * Управление аккаунтом Keycloak
   */
  async function accountManagement() {
    try {
      if (!keycloak.value) {
        throw new Error('Keycloak not initialized')
      }

      await keycloak.value.accountManagement()
    } catch (error) {
      console.error('[Auth] Account management failed:', error)
      throw error
    }
  }

  /**
   * Проверка аутентификации (для guards)
   */
  function checkAuth(): boolean {
    if (!keycloak.value || !isInitialized.value) {
      console.warn('[Auth] Keycloak not initialized')
      return false
    }

    return isAuthenticated.value
  }

  /**
   * Проверка разрешения (permission-based)
   */
  function hasPermission(permission: string): boolean {
    // Можно расширить логику проверки разрешений
    // Например, через mapping ролей на разрешения
    return allRoles.value.includes(permission)
  }

  /**
   * Получить время истечения токена
   */
  function getTokenExpirationTime(): Date | null {
    if (!tokenParsed.value?.exp) return null
    return new Date(tokenParsed.value.exp * 1000)
  }

  /**
   * Получить время до истечения токена (в секундах)
   */
  function getTimeToExpiration(): number | null {
    const expirationTime = getTokenExpirationTime()
    if (!expirationTime) return null

    const now = new Date()
    return Math.floor((expirationTime.getTime() - now.getTime()) / 1000)
  }

  /**
   * Сброс store (для тестов)
   */
  function $reset() {
    keycloak.value = null
    isAuthenticated.value = false
    isInitialized.value = false
    isInitializing.value = false
  }

  return {
    // State
    keycloak,
    isAuthenticated,
    isInitialized,
    isInitializing,

    // Getters
    token,
    refreshToken,
    idToken,
    tokenParsed,
    userId,
    userEmail,
    preferredUsername,
    hasRole,
    hasRealmRole,
    hasResourceRole,
    isAdmin,
    isModerator,
    realmAccess,
    resourceAccess,
    allRoles,

    // Actions
    initKeycloak,
    login,
    logout,
    register,
    updateToken,
    isTokenExpired,
    loadKeycloakProfile,
    accountManagement,
    checkAuth,
    hasPermission,
    getTokenExpirationTime,
    getTimeToExpiration,
    $reset,
  }
})
