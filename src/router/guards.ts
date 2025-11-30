// src/router/guards.ts
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { login, getKeycloak } from '@/plugins/keycloak'

/**
 * Проверка роли через Keycloak напрямую
 */
function checkRole(role: string): boolean {
  const keycloak = getKeycloak()
  return keycloak?.hasRealmRole(role) ?? false
}

/**
 * Проверка любой из ролей
 */
function hasAnyRole(roles: string[]): boolean {
  return roles.some((role) => checkRole(role))
}

/**
 * Ожидание инициализации
 */
async function waitForInit(timeoutMs = 5000): Promise<boolean> {
  const authStore = useAuthStore()
  const startTime = Date.now()

  while (!authStore.isInitialized) {
    if (Date.now() - startTime > timeoutMs) {
      return false
    }
    await new Promise((r) => setTimeout(r, 100))
  }

  return true
}

/**
 * Auth Guard
 */
export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): Promise<void> {
  const authStore = useAuthStore()

  // Ждём инициализации
  const ready = await waitForInit()
  if (!ready) {
    console.error('[AuthGuard] Timeout waiting for Keycloak')
    return next({ name: 'error', query: { code: '503' } })
  }

  // Проверяем авторизацию
  if (!authStore.isAuthenticated) {
    console.log('[AuthGuard] Redirecting to Keycloak login')

    login({
      redirectUri: window.location.origin + to.fullPath,
    })

    // Отменяем текущую навигацию
    return next(false)
  }

  // Проверяем роли
  const roles = to.meta.roles as string[] | undefined
  if (roles?.length && !hasAnyRole(roles)) {
    console.warn('[AuthGuard] Missing required roles:', roles)
    return next({ name: 'error', query: { code: '403' } })
  }

  next()
}

/**
 * Role Guard Factory
 */
export function createRoleGuard(requiredRoles: string[]) {
  return async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ): Promise<void> => {
    const authStore = useAuthStore()

    // Проверяем auth
    if (!authStore.isAuthenticated) {
      return authGuard(to, from, next)
    }

    // Проверяем роли
    if (!hasAnyRole(requiredRoles)) {
      return next({ name: 'error', query: { code: '403' } })
    }

    next()
  }
}

export const adminGuard = createRoleGuard(['admin'])
export const moderatorGuard = createRoleGuard(['admin', 'moderator'])
