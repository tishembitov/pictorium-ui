/**
 * useRoles Composable
 *
 * Composable для работы с Keycloak ролями
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { getKeycloak } from '@/plugins/keycloak'
import { PERMISSION_ROLE_MAP } from '@/utils/constants'
import { getUserRoles, hasRole as jwtHasRole } from '@/utils/jwt'
import { useAuth } from './useAuth'

export interface UseRolesReturn {
  // Getters
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasAllRoles: (roles: string[]) => boolean
  isAdmin: ComputedRef<boolean>
  isModerator: ComputedRef<boolean>
  isUser: ComputedRef<boolean>
  userRoles: ComputedRef<string[]>

  // Resource roles
  hasResourceRole: (resource: string, role: string) => boolean
  getResourceRoles: (resource: string) => string[]
}

/**
 * useRoles
 *
 * @example
 * ```ts
 * const { hasRole, isAdmin, userRoles } = useRoles()
 *
 * if (hasRole('admin')) {
 *   // Показать админ-панель
 * }
 *
 * if (hasAnyRole(['moderator', 'admin'])) {
 *   // Показать кнопку удаления
 * }
 * ```
 */
export function useRoles(): UseRolesReturn {
  const authStore = useAuthStore()
  const { token, isAuthenticated } = storeToRefs(authStore)
  const keycloak = getKeycloak()

  /**
   * Проверка наличия роли
   */
  const hasRole = (role: string): boolean => {
    if (!isAuthenticated.value) return false

    // Через Keycloak instance (приоритет)
    if (keycloak && keycloak.hasRealmRole) {
      return keycloak.hasRealmRole(role)
    }

    // Fallback через JWT token
    if (token.value) {
      return jwtHasRole(token.value, role)
    }

    return false
  }

  /**
   * Проверка наличия хотя бы одной роли
   */
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some((role) => hasRole(role))
  }

  /**
   * Проверка наличия всех ролей
   */
  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every((role) => hasRole(role))
  }

  /**
   * Проверка resource-специфичной роли
   */
  const hasResourceRole = (resource: string, role: string): boolean => {
    if (!keycloak || !keycloak.hasResourceRole) return false
    return keycloak.hasResourceRole(role, resource)
  }

  /**
   * Получить роли для конкретного resource
   */
  const getResourceRoles = (resource: string): string[] => {
    if (!token.value) return []

    const keycloak = getKeycloak()
    if (!keycloak || !keycloak.tokenParsed) return []

    const resourceAccess = keycloak.tokenParsed.resource_access
    if (!resourceAccess || !resourceAccess[resource]) return []

    return resourceAccess[resource].roles || []
  }

  /**
   * Computed: все роли пользователя
   */
  const userRoles = computed<string[]>(() => {
    if (!token.value) return []
    return getUserRoles(token.value)
  })

  /**
   * Computed: является ли админом
   */
  const isAdmin = computed(() => hasRole('admin'))

  /**
   * Computed: является ли модератором
   */
  const isModerator = computed(() => hasRole('moderator'))

  /**
   * Computed: является ли обычным пользователем
   */
  const isUser = computed(() => hasRole('user'))

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isModerator,
    isUser,
    userRoles,
    hasResourceRole,
    getResourceRoles,
  }
}

/**
 * useRoleGuard
 *
 * Wrapper для защиты компонентов через роли
 *
 * @example
 * ```ts
 * const { canAccess, requiredRole } = useRoleGuard('admin')
 *
 * if (!canAccess.value) {
 *   router.push('/forbidden')
 * }
 * ```
 */
export function useRoleGuard(role: string | string[]) {
  const { hasRole, hasAnyRole } = useRoles()

  const canAccess = computed(() => {
    if (Array.isArray(role)) {
      return hasAnyRole(role)
    }
    return hasRole(role)
  })

  const requiredRole = computed(() => role)

  return {
    canAccess,
    requiredRole,
  }
}

/**
 * useOwnershipCheck
 *
 * Проверка владения ресурсом
 *
 * @example
 * ```ts
 * const { canEdit, canDelete } = useOwnershipCheck(pin.userId)
 *
 * if (canEdit.value) {
 *   // Показать кнопку редактирования
 * }
 * ```
 */
export function useOwnershipCheck(ownerId: Ref<string> | string) {
  const { userId } = useAuth()
  const { isAdmin, isModerator } = useRoles()

  const id = computed(() => (typeof ownerId === 'string' ? ownerId : ownerId.value))

  const isOwner = computed(() => {
    return userId.value === id.value
  })

  const canEdit = computed(() => {
    return isOwner.value || isAdmin.value
  })

  const canDelete = computed(() => {
    return isOwner.value || isModerator.value || isAdmin.value
  })

  return {
    isOwner,
    canEdit,
    canDelete,
  }
}

/**
 * useAdminGuard
 *
 * Shortcut для проверки admin роли
 *
 * @example
 * ```ts
 * const { isAdmin } = useAdminGuard()
 *
 * if (!isAdmin.value) {
 *   throw new Error('Access denied')
 * }
 * ```
 */
export function useAdminGuard() {
  const { isAdmin } = useRoles()
  return { isAdmin }
}

/**
 * usePermissions
 *
 * Composable для проверки разрешений (permissions)
 * Расширение ролей для fine-grained контроля
 *
 * @example
 * ```ts
 * const { can } = usePermissions()
 *
 * if (can('delete:pin')) {
 *   // Показать кнопку удаления
 * }
 * ```
 */
export function usePermissions() {
  const { hasAnyRole } = useRoles()

  const can = (permission: string): boolean => {
    const roles = PERMISSION_ROLE_MAP[permission]
    if (!roles) return false
    return hasAnyRole(roles)
  }

  /**
   * Проверка нескольких permissions (AND)
   */
  const canAll = (permissions: string[]): boolean => {
    return permissions.every(can)
  }

  /**
   * Проверка нескольких permissions (OR)
   */
  const canAny = (permissions: string[]): boolean => {
    return permissions.some(can)
  }

  return {
    can,
    canAll,
    canAny,
  }
}
