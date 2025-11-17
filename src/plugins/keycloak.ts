import { App } from 'vue'
import Keycloak from 'keycloak-js'
import { useAuthStore } from '@/stores/auth.store'

let keycloak: Keycloak | null = null

export async function setupKeycloak(app: App) {
  keycloak = new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'pinterest-clone',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'vue-app',
  })

  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    })

    // Глобальный доступ к Keycloak
    app.config.globalProperties.$keycloak = keycloak
    app.provide('keycloak', keycloak)

    if (authenticated) {
      const authStore = useAuthStore()
      await authStore.setKeycloakUser(keycloak)
    }

    // Обновление токена каждые 30 секунд
    setInterval(() => {
      keycloak?.updateToken(70).catch(() => {
        console.error('Failed to refresh token')
      })
    }, 30000)
  } catch (error) {
    console.error('Failed to initialize Keycloak:', error)
  }
}

export function getKeycloak(): Keycloak | null {
  return keycloak
}
