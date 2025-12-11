import React, { 
    createContext, 
    useContext, 
    useEffect, 
    useState, 
    useCallback,
    useMemo,
    type ReactNode 
  } from 'react';
  import Keycloak from 'keycloak-js';
  import { 
    keycloak, 
    keycloakInitOptions, 
    TOKEN_MIN_VALIDITY, 
    TOKEN_REFRESH_INTERVAL 
  } from '../config/keycloak';
  
  interface AuthContextType {
    isAuthenticated: boolean;
    isInitialized: boolean;
    isLoading: boolean;
    token: string | undefined;
    userId: string | undefined;
    username: string | undefined;
    email: string | undefined;
    roles: string[];
    login: (redirectUri?: string) => Promise<void>;
    logout: (redirectUri?: string) => Promise<void>;
    register: (redirectUri?: string) => Promise<void>;
    refreshToken: () => Promise<boolean>;
    keycloak: Keycloak;
  }
  
  const AuthContext = createContext<AuthContextType | null>(null);
  
  interface AuthProviderProps {
    children: ReactNode;
    fallback?: ReactNode;
  }
  
  export const AuthProvider: React.FC<AuthProviderProps> = ({ 
    children, 
    fallback = null 
  }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState<string | undefined>();
  
    // Initialize Keycloak
    useEffect(() => {
      const initKeycloak = async () => {
        try {
          const authenticated = await keycloak.init(keycloakInitOptions);
          setIsAuthenticated(authenticated);
          setToken(keycloak.token);
          setIsInitialized(true);
          setIsLoading(false);
  
          if (authenticated) {
            console.log('User authenticated');
          }
        } catch (error) {
          console.error('Keycloak initialization failed:', error);
          setIsInitialized(true);
          setIsLoading(false);
        }
      };
  
      initKeycloak();
    }, []);
  
    // Token refresh
    useEffect(() => {
      if (!isAuthenticated) return;
  
      const refreshInterval = setInterval(async () => {
        try {
          const refreshed = await keycloak.updateToken(TOKEN_MIN_VALIDITY);
          if (refreshed) {
            setToken(keycloak.token);
            console.log('Token refreshed');
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          setIsAuthenticated(false);
          setToken(undefined);
        }
      }, TOKEN_REFRESH_INTERVAL);
  
      return () => clearInterval(refreshInterval);
    }, [isAuthenticated]);
  
    // Auth event handlers
    useEffect(() => {
      const onAuthSuccess = () => {
        setIsAuthenticated(true);
        setToken(keycloak.token);
      };
  
      const onAuthLogout = () => {
        setIsAuthenticated(false);
        setToken(undefined);
      };
  
      const onTokenExpired = async () => {
        try {
          await keycloak.updateToken(TOKEN_MIN_VALIDITY);
          setToken(keycloak.token);
        } catch (error) {
          console.error('Token expired and refresh failed:', error);
          onAuthLogout();
        }
      };
  
      keycloak.onAuthSuccess = onAuthSuccess;
      keycloak.onAuthLogout = onAuthLogout;
      keycloak.onTokenExpired = onTokenExpired;
  
      return () => {
        keycloak.onAuthSuccess = undefined;
        keycloak.onAuthLogout = undefined;
        keycloak.onTokenExpired = undefined;
      };
    }, []);
  
    const login = useCallback(async (redirectUri?: string) => {
      await keycloak.login({
        redirectUri: redirectUri || window.location.origin,
      });
    }, []);
  
    const logout = useCallback(async (redirectUri?: string) => {
      await keycloak.logout({
        redirectUri: redirectUri || window.location.origin,
      });
    }, []);
  
    const register = useCallback(async (redirectUri?: string) => {
      await keycloak.register({
        redirectUri: redirectUri || window.location.origin,
      });
    }, []);
  
    const refreshToken = useCallback(async (): Promise<boolean> => {
      try {
        const refreshed = await keycloak.updateToken(-1);
        if (refreshed) {
          setToken(keycloak.token);
        }
        return true;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      }
    }, []);
  
    // Extract user info from token
    const userInfo = useMemo(() => {
      if (!keycloak.tokenParsed) {
        return { userId: undefined, username: undefined, email: undefined, roles: [] };
      }
  
      const parsed = keycloak.tokenParsed as any;
      return {
        userId: parsed.sub as string | undefined,
        username: parsed.preferred_username as string | undefined,
        email: parsed.email as string | undefined,
        roles: parsed.realm_access?.roles || [],
      };
    }, [token]);
  
    const contextValue = useMemo<AuthContextType>(() => ({
      isAuthenticated,
      isInitialized,
      isLoading,
      token,
      userId: userInfo.userId,
      username: userInfo.username,
      email: userInfo.email,
      roles: userInfo.roles,
      login,
      logout,
      register,
      refreshToken,
      keycloak,
    }), [
      isAuthenticated,
      isInitialized,
      isLoading,
      token,
      userInfo,
      login,
      logout,
      register,
      refreshToken,
    ]);
  
    if (!isInitialized) {
      return <>{fallback}</>;
    }
  
    return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );
  };
  
  export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };
  
  export default AuthProvider;