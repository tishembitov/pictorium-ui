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
export { useToast, type Toast, type ToastType, type ToastOptions } from './useToast';
export { useTheme, ThemeContext, type ThemeContextType } from './useTheme';
export { useModal } from './useModal';
export { useConfirmModal } from './useConfirmModal';