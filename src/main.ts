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
    // 1. Stores (Pinia)
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
    const errorMessage = error instanceof Error ? error.message : String(error)

    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Inter, sans-serif; background: #f8f8f8;">
        <div style="text-align: center; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 500px;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🐰</div>
          <h1 style="color: #111; margin-bottom: 0.5rem;">Failed to initialize application</h1>
          <p style="color: #666; margin-bottom: 1rem;">Please refresh the page or contact support.</p>
          <pre style="color: #e60023; background: #fff5f5; padding: 1rem; border-radius: 8px; overflow-x: auto; text-align: left; font-size: 12px;">${errorMessage}</pre>
          <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #e60023; color: white; border: none; border-radius: 24px; cursor: pointer; font-weight: 600;">
            Refresh Page
          </button>
        </div>
      </div>
    `
  }
}

bootstrap()
