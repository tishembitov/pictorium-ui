import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setupPlugins } from './plugins'
import { setupDirectives } from './directives'

// Styles
import './assets/main.css'

async function bootstrap() {
  const app = createApp(App)

  // Pinia
  app.use(createPinia())

  // Router
  app.use(router)

  // Setup all plugins (включая Keycloak)
  await setupPlugins(app)

  // Setup directives
  setupDirectives(app)

  // Mount app
  app.mount('#app')
}

bootstrap()
