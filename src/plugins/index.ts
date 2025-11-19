import type { App } from 'vue'
import { setupKeycloak, getKeycloak } from './keycloak'
import { setupToast } from './toast'
import { setupMasonry } from './masonry'
import { setupAutoAnimate } from './autoAnimate'
import { setupLucideIcons } from './lucideIcons'
import { setupAxios } from './axios'
import { useAuthStore } from '@/stores/auth.store'

export async function setupPlugins(app: App) {
  // 1. Сначала настраиваем Keycloak
  const authenticated = await setupKeycloak(app)

  // 2. Настраиваем остальные плагины
  setupAxios(app)
  setupToast(app)
  setupMasonry(app)
  setupAutoAnimate(app)
  setupLucideIcons(app)

  // 3. Инициализируем Auth Store (Pinia уже подключена в main.ts)
  // Это безопасно делать здесь, так как все файлы уже загружены
  if (authenticated) {
    const keycloak = getKeycloak()
    if (keycloak) {
      const authStore = useAuthStore()
      await authStore.initKeycloak(keycloak)
    }
  }
}
