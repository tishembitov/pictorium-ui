import type { App } from 'vue'
import * as lucideIcons from 'lucide-vue-next'

export function setupLucideIcons(app: App) {
  // Регистрируем все иконки глобально
  Object.entries(lucideIcons).forEach(([name, component]) => {
    if (name !== 'default' && typeof component !== 'function') {
      app.component(name, component as any)
    }
  })
}
