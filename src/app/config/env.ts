interface EnvConfig {
    // API
    apiGatewayUrl: string;
    
    // Keycloak
    keycloakUrl: string;
    keycloakRealm: string;
    keycloakClientId: string;
    
    // App
    appName: string;
    isDevelopment: boolean;
    isProduction: boolean;
  }
  
  const getEnvVar = (key: string, defaultValue?: string): string => {
    const value = import.meta.env[key] || defaultValue;
    if (value === undefined) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return value;
  };
  
  export const env: EnvConfig = {
    // API
    apiGatewayUrl: getEnvVar('VITE_API_GATEWAY_URL', 'http://localhost:8222'),
    
    // Keycloak
    keycloakUrl: getEnvVar('VITE_KEYCLOAK_URL', 'http://localhost:9090'),
    keycloakRealm: getEnvVar('VITE_KEYCLOAK_REALM', 'pinthis'),
    keycloakClientId: getEnvVar('VITE_KEYCLOAK_CLIENT_ID', 'pinthis-client'),
    
    // App
    appName: getEnvVar('VITE_APP_NAME', 'PinThis'),
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  };
  
  export default env;