// src/shared/hooks/useToast.ts
import { useCallback, useMemo } from 'react';
import { useToastStore, type ToastOptions } from '../stores/toastStore';

/**
 * Hook for using toasts with convenience methods
 */
export function useToast() {
  const toasts = useToastStore((state) => state.toasts);
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);
  const clearToasts = useToastStore((state) => state.clearToasts);
  const updateToast = useToastStore((state) => state.updateToast);

  const success = useCallback(
    (message: string, options?: ToastOptions) => {
      return addToast({ type: 'success', message, ...options });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: ToastOptions) => {
      return addToast({ type: 'error', message, ...options });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: ToastOptions) => {
      return addToast({ type: 'warning', message, ...options });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: ToastOptions) => {
      return addToast({ type: 'info', message, ...options });
    },
    [addToast]
  );

  const dismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success,
      error,
      warning,
      info,
      custom: addToast,
      dismiss,
      update: updateToast,
      clear: clearToasts,
    }),
    [success, error, warning, info, addToast, dismiss, updateToast, clearToasts]
  );

  return {
    toasts,
    toast,
    addToast,
    removeToast,
    clearToasts,
    updateToast,
  };
}

// Re-export types
export type { Toast, ToastType, ToastOptions } from '../stores/toastStore';

export default useToast;