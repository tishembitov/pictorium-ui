// src/stores/auth.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type Keycloak from 'keycloak-js'

/**
 * Auth Store - только для СОСТОЯНИЯ Keycloak
 * Всю логику работы с Keycloak оставляем в plugins/keycloak.ts
 */
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
   * Инициализация Keycloak (вызывается из plugin)
   */
  function initKeycloak(keycloakInstance: Keycloak) {
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
   * Обновление состояния аутентификации
   */
  function updateAuthState(authenticated: boolean) {
    isAuthenticated.value = authenticated
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
   * Проверка валидности токена
   */
  function isTokenExpired(): boolean {
    if (!keycloak.value) return true
    return keycloak.value.isTokenExpired()
  }

  /**
   * Сброс store (для тестов и logout)
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
    updateAuthState,
    checkAuth,
    hasPermission,
    getTokenExpirationTime,
    getTimeToExpiration,
    isTokenExpired,
    $reset,
  }
})
