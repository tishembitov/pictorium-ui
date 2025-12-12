// src/shared/hooks/index.ts
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useIntersectionObserver, useInfiniteScroll } from './useIntersectionObserver';
export { useLocalStorage } from './useLocalStorage';
export { 
  useMediaQuery, 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop, 
  useIsLargeDesktop,
  usePrefersReducedMotion,
  usePrefersDarkMode,
} from './useMediaQuery';
export { useClickOutside, useClickOutsideMultiple } from './useClickOutside';
export { useCopyToClipboard } from './useCopyToClipboard';
export { useToast, useToastStore, type Toast, type ToastType } from './useToast';
export { useTheme, ThemeContext, type ThemeContextType } from './useTheme';