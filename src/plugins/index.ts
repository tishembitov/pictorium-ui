import { App } from 'vue'
import { setupKeycloak } from './keycloak'
import { setupToast } from './toast'
import { setupMasonry } from './masonry'
import { setupAutoAnimate } from './autoAnimate'
import { setupLucideIcons } from './lucideIcons'
import { setupAxios } from './axios'

export async function setupPlugins(app: App) {
  // Сначала настраиваем Keycloak (критично для авторизации)
  await setupKeycloak(app)

  // Затем остальные плагины
  setupAxios(app)
  setupToast(app)
  setupMasonry(app)
  setupAutoAnimate(app)
  setupLucideIcons(app)
}
