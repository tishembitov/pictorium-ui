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

const getResolvedTheme = (scheme: ColorScheme): 'light' | 'dark' => {
  if (scheme === 'dark') return 'dark';
  if (scheme === 'light') return 'light';
  
  // userPreference
  if (typeof globalThis.window !== 'undefined') {
    return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  }
  return 'light';
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultColorScheme = 'light',
}) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => 
    getSavedColorScheme(defaultColorScheme)
  );

  // Apply theme to DOM
  useEffect(() => {
    const root = globalThis.document?.documentElement;
    const body = globalThis.document?.body;
    
    if (!root || !body) return;

    const resolvedTheme = getResolvedTheme(colorScheme);

    // Set data attributes
    root.setAttribute('data-theme', resolvedTheme);
    body.setAttribute('data-theme', resolvedTheme);
    
    // Set classes
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    
    body.classList.remove('light', 'dark');
    body.classList.add(resolvedTheme);

    // Update meta theme-color
    const meta = globalThis.document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        'content', 
        resolvedTheme === 'dark' ? '#0d1117' : '#ffffff'
      );
    }

    // Update color-scheme
    root.style.colorScheme = resolvedTheme;
  }, [colorScheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (colorScheme !== 'userPreference') return;

    const mediaQuery = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const handler = () => {
      // Force re-render to update resolved theme
      setColorSchemeState('userPreference');
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [colorScheme]);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    saveColorScheme(scheme);
  }, []);

  const toggleColorScheme = useCallback(() => {
    setColorSchemeState((current) => {
      const resolved = getResolvedTheme(current);
      const newScheme = resolved === 'dark' ? 'light' : 'dark';
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

  const resolvedTheme = useMemo(() => getResolvedTheme(colorScheme), [colorScheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <ColorSchemeProvider colorScheme={resolvedTheme}>
        <Box 
          color="default"
          minHeight="100vh"
          display="flex"
          direction="column"
          dangerouslySetInlineStyle={{
            __style: {
              backgroundColor: 'var(--color-bg-base)',
              color: 'var(--color-text-base)',
            },
          }}
        >
          {children}
        </Box>
      </ColorSchemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;