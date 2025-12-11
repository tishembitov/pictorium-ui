import Keycloak from 'keycloak-js';
import { env } from './env';

export const keycloakConfig = {
  url: env.keycloakUrl,
  realm: env.keycloakRealm,
  clientId: env.keycloakClientId,
};

export const keycloakInitOptions: Keycloak.KeycloakInitOptions = {
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
  pkceMethod: 'S256',
  checkLoginIframe: false,
};

export const keycloak = new Keycloak(keycloakConfig);

// Token refresh settings
export const TOKEN_MIN_VALIDITY = 30; // seconds
export const TOKEN_REFRESH_INTERVAL = 10000; // ms

export default keycloak;