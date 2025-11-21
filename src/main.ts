import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setupPlugins } from './plugins'
import { setupDirectives } from './directives'
import { getKeycloak } from './plugins/keycloak'
import { useAuthStore } from './stores/auth.store'

// Styles
import './assets/main.css'

async function bootstrap() {
  const app = createApp(App)

  // Pinia ПЕРВЫМ
  app.use(createPinia())

  // Router
  app.use(router)

  // Setup all plugins (включая Keycloak)
  const { authenticated } = await setupPlugins(app)

  // Setup directives
  setupDirectives(app)

  // Инициализация Auth Store ПОСЛЕ Pinia и Keycloak
  if (authenticated) {
    const keycloak = getKeycloak()
    if (keycloak) {
      const authStore = useAuthStore()
      await authStore.initKeycloak(keycloak)
    }
  }

  // Mount app
  app.mount('#app')
}

bootstrap()
