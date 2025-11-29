import type { App } from 'vue'
import { setupKeycloak, getKeycloak } from './keycloak'
import { setupToast } from './toast'
import { setupMasonry } from './masonry'
import { setupAutoAnimate } from './autoAnimate'
import { setupLucideIcons } from './lucideIcons'
import { setupAxios } from './axios'
import i18n from './i18n'

export async function setupPlugins(app: App) {
  app.use(i18n)
  // 1. Сначала настраиваем Keycloak
  const authenticated = await setupKeycloak(app)

  // 2. Настраиваем остальные плагины
  setupAxios(app)
  setupToast(app)
  setupMasonry(app)
  setupAutoAnimate(app)
  setupLucideIcons(app)

  // 3. Возвращаем статус аутентификации для использования в main.ts
  return { authenticated }
}
