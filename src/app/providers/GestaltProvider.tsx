import React, { type ReactNode, useState, useCallback, useMemo, createContext, useContext } from 'react';
import { ColorSchemeProvider, Box } from 'gestalt';

type ColorScheme = 'light' | 'dark' | 'userPreference';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface GestaltProviderProps {
  children: ReactNode;
  defaultColorScheme?: ColorScheme;
}

const THEME_STORAGE_KEY = 'pinthis-color-scheme';

const getInitialColorScheme = (defaultScheme: ColorScheme): ColorScheme => {
  if (typeof window === 'undefined') return defaultScheme;
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && ['light', 'dark', 'userPreference'].includes(stored)) {
    return stored as ColorScheme;
  }
  return defaultScheme;
};

export const GestaltProvider: React.FC<GestaltProviderProps> = ({ 
  children,
  defaultColorScheme = 'userPreference'
}) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
    () => getInitialColorScheme(defaultColorScheme)
  );

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    localStorage.setItem(THEME_STORAGE_KEY, scheme);
  }, []);

  const toggleColorScheme = useCallback(() => {
    setColorSchemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const themeContextValue = useMemo<ThemeContextType>(() => ({
    colorScheme,
    setColorScheme,
    toggleColorScheme,
  }), [colorScheme, setColorScheme, toggleColorScheme]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <ColorSchemeProvider colorScheme={colorScheme}>
        <Box 
          color="default" 
          minHeight="100vh"
          display="flex"
          direction="column"
        >
          {children}
        </Box>
      </ColorSchemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a GestaltProvider');
  }
  return context;
};

export default GestaltProvider;