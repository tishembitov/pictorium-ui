// frontend/src/router/guards/auth.guard.ts
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { login } from '@/plugins/keycloak'

export async function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()

  // Ждём инициализации Keycloak
  if (!authStore.isInitialized) {
    // Подождём немного
    await new Promise<void>((resolve) => {
      const unwatch = setInterval(() => {
        if (authStore.isInitialized) {
          clearInterval(unwatch)
          resolve()
        }
      }, 50)

      // Timeout
      setTimeout(() => {
        clearInterval(unwatch)
        resolve()
      }, 5000)
    })
  }

  if (authStore.isAuthenticated) {
    next()
  } else {
    // Редирект на Keycloak с сохранением целевого URL
    login({ redirectUri: window.location.origin + to.fullPath })
  }
}

export function guestGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    next()
  } else {
    // Уже авторизован - редирект на главную
    next({ name: 'home' })
  }
}
