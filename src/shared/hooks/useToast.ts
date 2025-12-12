// src/shared/hooks/useToast.ts
import { create } from 'zustand';
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
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      duration: TIME.TOAST_DURATION,
      dismissible: true,
      ...toast,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

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
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Hook for using toasts
export function useToast() {
  const { toasts, addToast, removeToast, clearToasts } = useToastStore();

  const toast = {
    success: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
      return addToast({ type: 'success', message, ...options });
    },
    
    error: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
      return addToast({ type: 'error', message, ...options });
    },
    
    warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
      return addToast({ type: 'warning', message, ...options });
    },
    
    info: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => {
      return addToast({ type: 'info', message, ...options });
    },
    
    custom: (toast: Omit<Toast, 'id'>) => {
      return addToast(toast);
    },
    
    dismiss: (id: string) => {
      removeToast(id);
    },
    
    clear: () => {
      clearToasts();
    },
  };

  return {
    toasts,
    toast,
    addToast,
    removeToast,
    clearToasts,
  };
}

export default useToast;