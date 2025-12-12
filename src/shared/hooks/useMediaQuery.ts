// src/shared/hooks/useMediaQuery.ts
import { useSyncExternalStore, useCallback } from 'react';
import { BREAKPOINTS } from '../utils/constants';

export function useMediaQuery(query: string): boolean {
  // For SSR, return false
  const getServerSnapshot = useCallback(() => false, []);

  const subscribe = useCallback((callback: () => void) => {
    if (typeof globalThis.window === 'undefined') {
      return () => {};
    }
    
    const mediaQuery = globalThis.matchMedia(query);
    mediaQuery.addEventListener('change', callback);
    return () => mediaQuery.removeEventListener('change', callback);
  }, [query]);

  const getSnapshot = useCallback(() => {
    if (typeof globalThis.window === 'undefined') {
      return false;
    }
    return globalThis.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Preset hooks for common breakpoints
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.SM - 1}px)`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.SM}px) and (max-width: ${BREAKPOINTS.MD - 1}px)`
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.MD}px)`);
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.LG}px)`);
}

// Prefer reduced motion
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

// Prefer dark mode
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

export default useMediaQuery;