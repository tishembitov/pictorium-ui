// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setupStores } from './stores'
import { setupPlugins } from './plugins'
import { setupDirectives } from './directives'
import { setupTheme } from './plugins/theme'
import './assets/styles/main.css'

async function bootstrap() {
  const app = createApp(App)

  try {
    // 1. Stores
    setupStores(app)

    // 2. Plugins (включая Keycloak)
    const { authenticated } = await setupPlugins(app)

    // 3. Directives
    setupDirectives(app)

    // 4. Theme
    setupTheme(app)

    // 5. Router
    app.use(router)

    // 6. Mount
    app.mount('#app')

    console.log('[App] Initialized successfully:', { authenticated })
  } catch (error) {
    console.error('[App] Failed to initialize:', error)

    // Показываем пользователю ошибку
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
        <div style="text-align: center;">
          <h1>Failed to initialize application</h1>
          <p>Please refresh the page or contact support.</p>
          <pre style="color: red;">${error}</pre>
        </div>
      </div>
    `
  }
}

bootstrap()
