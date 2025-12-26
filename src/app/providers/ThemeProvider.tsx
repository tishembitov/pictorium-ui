// src/app/providers/ThemeProvider.tsx

import React, { useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { ColorSchemeProvider, Box } from 'gestalt';
import { ThemeContext, type ThemeContextType } from '@/shared/hooks/useTheme';
import { STORAGE_KEYS } from '@/shared/utils/constants';

type ColorScheme = 'light' | 'dark' | 'userPreference';

interface ThemeProviderProps {
  children: ReactNode;
  defaultColorScheme?: ColorScheme;
}

const getSavedColorScheme = (fallback: ColorScheme): ColorScheme => {
  if (typeof globalThis.window === 'undefined') {
    return fallback;
  }
  
  try {
    const saved = globalThis.localStorage.getItem(STORAGE_KEYS.COLOR_SCHEME);
    if (saved === 'light' || saved === 'dark' || saved === 'userPreference') {
      return saved;
    }
  } catch {
    // Ignore
  }
  
  return fallback;
};

const saveColorScheme = (scheme: ColorScheme): void => {
  try {
    globalThis.localStorage.setItem(STORAGE_KEYS.COLOR_SCHEME, scheme);
  } catch {
    // Ignore
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultColorScheme = 'light',
}) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => 
    getSavedColorScheme(defaultColorScheme)
  );

  // Синхронизация с DOM
  useEffect(() => {
    const root = globalThis.document?.documentElement;
    const body = globalThis.document?.body;
    
    if (!root || !body) return;

    // Определяем реальную тему
    let resolvedTheme: 'light' | 'dark' = 'light';
    
    if (colorScheme === 'dark') {
      resolvedTheme = 'dark';
    } else if (colorScheme === 'userPreference') {
      resolvedTheme = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
    }

    // Устанавливаем атрибуты
    root.setAttribute('data-theme', resolvedTheme);
    body.setAttribute('data-theme', resolvedTheme);
    
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    
    body.classList.remove('light', 'dark');
    body.classList.add(resolvedTheme);

    // Обновляем meta theme-color
    const meta = globalThis.document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', resolvedTheme === 'dark' ? '#121212' : '#ffffff');
    }
  }, [colorScheme]);

  // Слушаем системные изменения
  useEffect(() => {
    if (colorScheme !== 'userPreference') return;

    const mediaQuery = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const handler = () => setColorSchemeState('userPreference');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [colorScheme]);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    saveColorScheme(scheme);
  }, []);

  const toggleColorScheme = useCallback(() => {
    setColorSchemeState((current) => {
      const newScheme = current === 'dark' ? 'light' : 'dark';
      saveColorScheme(newScheme);
      return newScheme;
    });
  }, []);

  const contextValue: ThemeContextType = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
      toggleColorScheme,
    }),
    [colorScheme, setColorScheme, toggleColorScheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
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

export default ThemeProvider;