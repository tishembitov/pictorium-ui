// src/composables/auth/usePermissions.ts
/**
 * usePermissions - Roles & Permissions
 *
 * Использует auth.store для проверки ролей.
 * Добавляет permission-based access control.
 */

import { computed, unref, type Ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSION_ROLE_MAP } from '@/utils/constants'

/**
 * useRoles - Проверка ролей
 */
export function useRoles() {
  const authStore = useAuthStore()

  return {
    // Computed roles
    isAdmin: computed(() => authStore.isAdmin),
    isModerator: computed(() => authStore.isModerator),
    userRoles: computed(() => authStore.allRoles),

    // Role checks (делегируем в store)
    hasRole: (role: string) => authStore.hasRole.value(role),
    hasRealmRole: (role: string) => authStore.hasRealmRole.value(role),
    hasResourceRole: (role: string, resource: string) =>
      authStore.hasResourceRole.value(role, resource),

    // Multiple roles
    hasAnyRole: (roles: string[]) => roles.some((r) => authStore.hasRole.value(r)),
    hasAllRoles: (roles: string[]) => roles.every((r) => authStore.hasRole.value(r)),
  }
}

/**
 * usePermissions - Permission-based access
 */
export function usePermissions() {
  const { hasAnyRole } = useRoles()

  /**
   * Проверить permission
   */
  const can = (permission: string): boolean => {
    const roles = PERMISSION_ROLE_MAP[permission]
    if (!roles) return false
    return hasAnyRole(roles)
  }

  /**
   * Проверить все permissions (AND)
   */
  const canAll = (permissions: string[]): boolean => permissions.every(can)

  /**
   * Проверить любой permission (OR)
   */
  const canAny = (permissions: string[]): boolean => permissions.some(can)

  return { can, canAll, canAny }
}

/**
 * useRoleGuard - Guard для компонентов
 */
export function useRoleGuard(requiredRole: string | string[]) {
  const { hasRole, hasAnyRole } = useRoles()

  const canAccess = computed(() =>
    Array.isArray(requiredRole) ? hasAnyRole(requiredRole) : hasRole(requiredRole),
  )

  return {
    canAccess,
    requiredRole: computed(() => requiredRole),
  }
}

/**
 * useOwnership - Проверка владения ресурсом
 */
export function useOwnership(resourceOwnerId: Ref<string> | string) {
  const authStore = useAuthStore()
  const { isAdmin, isModerator } = useRoles()

  const ownerId = computed(() => unref(resourceOwnerId))
  const currentUserId = computed(() => authStore.userId)

  const isOwner = computed(
    () => currentUserId.value !== null && currentUserId.value === ownerId.value,
  )

  const canEdit = computed(() => isOwner.value || isAdmin.value)
  const canDelete = computed(() => isOwner.value || isModerator.value || isAdmin.value)

  return {
    isOwner,
    canEdit,
    canDelete,
  }
}

/**
 * useAdminOnly - Shortcut для admin-only
 */
export function useAdminOnly() {
  const { isAdmin } = useRoles()
  return { isAdmin, canAccess: isAdmin }
}

/**
 * useModeratorOnly - Shortcut для moderator+
 */
export function useModeratorOnly() {
  const { isModerator, isAdmin } = useRoles()
  const canAccess = computed(() => isModerator.value || isAdmin.value)
  return { canAccess }
}
