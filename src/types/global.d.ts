import type Keycloak from 'keycloak-js'
import type { AxiosInstance } from 'axios'

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $keycloak: Keycloak
    $axios: AxiosInstance
  }
}

export {}
