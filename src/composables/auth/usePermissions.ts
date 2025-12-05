// src/composables/auth/usePermissions.ts
/**
 * usePermissions - Roles & Permissions
 *
 * Использует auth.store для проверки ролей.
 * НЕ дублирует - только computed wrappers.
 */

import { computed, unref, type Ref, type ComputedRef } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSION_ROLE_MAP } from '@/utils/constants'

/**
 * useRoles - Проверка ролей
 *
 * Использование:
 * ```ts
 * const { isAdmin, hasRole } = useRoles()
 *
 * if (isAdmin.value) {
 *   // admin actions
 * }
 *
 * if (hasRole('moderator')) {
 *   // moderator actions
 * }
 * ```
 */
export function useRoles() {
  const authStore = useAuthStore()

  // Computed shortcuts
  const isAdmin = computed(() => authStore.isAdmin)
  const isModerator = computed(() => authStore.isModerator)
  const roles = computed(() => authStore.allRoles)

  // Role check functions
  const hasRole = (role: string): boolean => {
    return authStore.hasRole(role)
  }

  const hasAnyRole = (requiredRoles: string[]): boolean => {
    return requiredRoles.some((role) => authStore.hasRole(role))
  }

  const hasAllRoles = (requiredRoles: string[]): boolean => {
    return requiredRoles.every((role) => authStore.hasRole(role))
  }

  return {
    isAdmin,
    isModerator,
    roles,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  }
}

/**
 * usePermissions - Permission-based access control
 *
 * Использование:
 * ```ts
 * const { can } = usePermissions()
 *
 * if (can('delete:pin')) {
 *   // show delete button
 * }
 * ```
 */
export function usePermissions() {
  const { hasAnyRole } = useRoles()

  /**
   * Проверить permission
   */
  const can = (permission: string): boolean => {
    const allowedRoles = PERMISSION_ROLE_MAP[permission]
    if (!allowedRoles) {
      console.warn(`[usePermissions] Unknown permission: ${permission}`)
      return false
    }
    return hasAnyRole(allowedRoles)
  }

  /**
   * Проверить все permissions (AND)
   */
  const canAll = (permissions: string[]): boolean => {
    return permissions.every(can)
  }

  /**
   * Проверить любой permission (OR)
   */
  const canAny = (permissions: string[]): boolean => {
    return permissions.some(can)
  }

  return { can, canAll, canAny }
}

/**
 * useRoleGuard - Guard для условного рендеринга
 *
 * Использование:
 * ```vue
 * <template>
 *   <AdminPanel v-if="canAccess" />
 *   <AccessDenied v-else />
 * </template>
 *
 * <script setup>
 * const { canAccess } = useRoleGuard(['admin', 'moderator'])
 * </script>
 * ```
 */
export function useRoleGuard(requiredRoles: string | string[]) {
  const { hasRole, hasAnyRole } = useRoles()

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

  const canAccess = computed(() => {
    return roles.length === 1 ? hasRole(roles[0]!) : hasAnyRole(roles)
  })

  return { canAccess }
}

/**
 * useOwnership - Проверка владения ресурсом
 *
 * Использование:
 * ```ts
 * const { isOwner, canEdit, canDelete } = useOwnership(pin.value.userId)
 *
 * // isOwner - текущий пользователь владелец
 * // canEdit - владелец или admin
 * // canDelete - владелец, moderator или admin
 * ```
 */
export function useOwnership(resourceOwnerId: Ref<string | null> | string | null) {
  const authStore = useAuthStore()
  const { isAdmin, isModerator } = useRoles()

  const ownerId = computed(() => unref(resourceOwnerId))
  const currentUserId = computed(() => authStore.userId)

  const isOwner = computed(() => {
    if (!currentUserId.value || !ownerId.value) return false
    return currentUserId.value === ownerId.value
  })

  const canEdit = computed(() => isOwner.value || isAdmin.value)

  const canDelete = computed(() => isOwner.value || isModerator.value || isAdmin.value)

  return {
    isOwner,
    canEdit,
    canDelete,
    ownerId,
    currentUserId,
  }
}

/**
 * useAdminOnly - Shortcut для admin-only контента
 */
export function useAdminOnly() {
  const { isAdmin } = useRoles()
  return { canAccess: isAdmin }
}

/**
 * useModeratorOnly - Shortcut для moderator+ контента
 */
export function useModeratorOnly() {
  const { isModerator, isAdmin } = useRoles()
  const canAccess = computed(() => isModerator.value || isAdmin.value)
  return { canAccess }
}

/**
 * useAuthenticatedOnly - Shortcut для authenticated контента
 */
export function useAuthenticatedOnly() {
  const authStore = useAuthStore()
  const canAccess = computed(() => authStore.isAuthenticated)
  return { canAccess }
}
