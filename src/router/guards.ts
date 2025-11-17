import { Router } from 'vue-router'
import { getKeycloak } from '@/plugins/keycloak'
import { useAuthStore } from '@/stores/auth.store'

export function setupGuards(router: Router) {
  // Global before guard
  router.beforeEach(async (to, from, next) => {
    const keycloak = getKeycloak()
    const authStore = useAuthStore()

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

      // Загружаем данные пользователя, если еще не загружены
      if (!authStore.user && keycloak.authenticated) {
        await authStore.setKeycloakUser(keycloak)
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
    // console.log(`Navigated from ${from.name} to ${to.name}`)
  })
}
