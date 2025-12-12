// src/shared/store/toastStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { generateId } from '../utils/helpers';
import { TIME } from '../utils/constants';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type ToastOptions = Omit<Toast, 'id' | 'type' | 'message'>;

interface ToastState {
  toasts: Toast[];
  maxToasts: number;
}

interface ToastActions {
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
  
  // Convenience methods
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
}

type ToastStore = ToastState & ToastActions;

const DEFAULT_MAX_TOASTS = 5;

export const useToastStore = create<ToastStore>()(
  devtools(
    (set, get) => ({
      toasts: [],
      maxToasts: DEFAULT_MAX_TOASTS,

      addToast: (toast) => {
        const id = generateId();
        const newToast: Toast = {
          id,
          duration: TIME.TOAST_DURATION,
          dismissible: true,
          ...toast,
        };

        set((state) => {
          // Remove oldest toasts if exceeding max
          let updatedToasts = [...state.toasts, newToast];
          if (updatedToasts.length > state.maxToasts) {
            updatedToasts = updatedToasts.slice(-state.maxToasts);
          }
          return { toasts: updatedToasts };
        }, false, 'addToast');

        // Auto remove after duration
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, newToast.duration);
        }

        return id;
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }), false, 'removeToast');
      },

      clearToasts: () => {
        set({ toasts: [] }, false, 'clearToasts');
      },

      updateToast: (id, updates) => {
        set((state) => ({
          toasts: state.toasts.map((toast) =>
            toast.id === id ? { ...toast, ...updates } : toast
          ),
        }), false, 'updateToast');
      },

      // Convenience methods
      success: (message, options) => {
        return get().addToast({ type: 'success', message, ...options });
      },

      error: (message, options) => {
        return get().addToast({ type: 'error', message, ...options });
      },

      warning: (message, options) => {
        return get().addToast({ type: 'warning', message, ...options });
      },

      info: (message, options) => {
        return get().addToast({ type: 'info', message, ...options });
      },
    }),
    { name: 'ToastStore' }
  )
);

// Selectors
export const selectToasts = (state: ToastStore) => state.toasts;
export const selectHasToasts = (state: ToastStore) => state.toasts.length > 0;

export default useToastStore;