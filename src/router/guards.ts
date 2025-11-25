// src/router/guards.ts
import type { Router } from 'vue-router'
import { getKeycloak } from '@/plugins/keycloak'
import { useAuthStore } from '@/stores/auth.store'
import { useUserStore } from '@/stores/user.store'

export function setupGuards(router: Router) {
  // Global before guard
  router.beforeEach(async (to, from, next) => {
    const keycloak = getKeycloak()
    const authStore = useAuthStore()
    const userStore = useUserStore()

    // Обновляем title
    document.title = to.meta.title ? `${to.meta.title} | Pinterest Clone` : 'Pinterest Clone'

    // Проверка авторизации для защищенных роутов
    if (to.meta.requiresAuth) {
      if (!keycloak?.authenticated) {
        // Сохраняем URL для редиректа после логина
        sessionStorage.setItem('redirectAfterLogin', to.fullPath)

        // Редиректим на landing
        next({ name: 'landing' })
        return
      }

      // Проверка ролей (если указаны)
      if (to.meta.roles && Array.isArray(to.meta.roles)) {
        const hasRole = to.meta.roles.some(
          (role: string) => keycloak.hasRealmRole(role) || keycloak.hasResourceRole(role),
        )

        if (!hasRole) {
          next({ name: 'forbidden' })
          return
        }
      }

      // ✅ ИСПРАВЛЕНО: initKeycloak синхронная, loadCurrentUser - async
      // Инициализируем auth store если нужно
      if (!authStore.isInitialized && keycloak) {
        authStore.initKeycloak(keycloak)
      }

      // Загружаем данные пользователя, если еще не загружены
      if (!userStore.currentUser && keycloak.authenticated) {
        try {
          await userStore.loadCurrentUser()
        } catch (error) {
          console.error('[Guard] Failed to load user:', error)
          // Продолжаем навигацию даже при ошибке
        }
      }
    }

    // Если пользователь авторизован и пытается попасть на landing
    if (to.name === 'landing' && keycloak?.authenticated) {
      next({ name: 'home' })
      return
    }

    next()
  })

  // Global after guard
  router.afterEach((to, from) => {
    // Analytics, logging и т.д.
    if (import.meta.env.DEV) {
      console.log(`[Router] ${from.path} → ${to.path}`)
    }
  })

  // Error handler
  router.onError((error) => {
    console.error('[Router] Navigation error:', error)
  })
}
