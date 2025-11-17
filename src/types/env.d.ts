/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Services
  readonly VITE_USER_SERVICE_URL: string
  readonly VITE_CONTENT_SERVICE_URL: string
  readonly VITE_STORAGE_SERVICE_URL: string

  // Keycloak
  readonly VITE_KEYCLOAK_URL: string
  readonly VITE_KEYCLOAK_REALM: string
  readonly VITE_KEYCLOAK_CLIENT_ID: string
  readonly VITE_KEYCLOAK_REDIRECT_URI: string
  readonly VITE_KEYCLOAK_ENABLE_LOGGING: string
  readonly VITE_KEYCLOAK_CHECK_LOGIN_IFRAME: string

  // App
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ALLOWED_IMAGE_TYPES: string
  readonly VITE_ALLOWED_VIDEO_TYPES: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
