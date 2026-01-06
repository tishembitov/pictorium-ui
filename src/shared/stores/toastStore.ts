// src/shared/stores/toastStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { generateId } from '../utils/helpers';
import { TIME } from '../utils/constants';

// ============ Toast Types ============
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export type ToastVariant = 
  | 'default'
  | 'pin'
  | 'board'
  | 'comment'
  | 'follow'
  | 'save'
  | 'delete'
  | 'update'
  | 'upload'
  | 'download'
  | 'copy'
  | 'auth';

export interface ToastAction {
  label: string;
  onClick: () => void;
  accessibilityLabel?: string;
}

export interface Toast {
  id: string;
  type: ToastType;
  variant?: ToastVariant;
  message: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
  icon?: string;
  progress?: number;
  timestamp?: number;
  groupId?: string;
  metadata?: Record<string, unknown>;
}

export interface ToastOptions extends Omit<Toast, 'id' | 'type' | 'message'> {
  replace?: boolean;
}

// ============ Preset Messages ============
export const TOAST_PRESETS = {
  // Pin operations
  PIN_SAVED: (boardName: string) => ({
    message: 'Pin saved!',
    description: `Added to "${boardName}"`,
    variant: 'save' as const,
  }),
  PIN_REMOVED: (boardName: string) => ({
    message: 'Pin removed',
    description: `Removed from "${boardName}"`,
    variant: 'delete' as const,
  }),
  PIN_CREATED: () => ({
    message: 'Pin created!',
    description: 'Your pin is now live',
    variant: 'pin' as const,
  }),
  PIN_UPDATED: () => ({
    message: 'Pin updated',
    variant: 'update' as const,
  }),
  PIN_DELETED: () => ({
    message: 'Pin deleted',
    variant: 'delete' as const,
  }),

  // Board operations
  BOARD_CREATED: (name: string) => ({
    message: 'Board created!',
    description: `"${name}" is ready to use`,
    variant: 'board' as const,
  }),
  BOARD_UPDATED: () => ({
    message: 'Board updated',
    variant: 'update' as const,
  }),
  BOARD_DELETED: () => ({
    message: 'Board deleted',
    variant: 'delete' as const,
  }),
  BOARD_SELECTED: (name: string) => ({
    message: 'Default board changed',
    description: `New pins will save to "${name}"`,
    variant: 'board' as const,
  }),

  // Follow operations
  FOLLOWED: (username: string) => ({
    message: `Following ${username}`,
    description: "You'll see their pins in your feed",
    variant: 'follow' as const,
  }),
  UNFOLLOWED: (username: string) => ({
    message: `Unfollowed ${username}`,
    variant: 'follow' as const,
  }),

  // Comment operations
  COMMENT_ADDED: () => ({
    message: 'Comment added',
    variant: 'comment' as const,
  }),
  COMMENT_DELETED: () => ({
    message: 'Comment deleted',
    variant: 'delete' as const,
  }),
  REPLY_ADDED: () => ({
    message: 'Reply added',
    variant: 'comment' as const,
  }),

  // Like operations
  PIN_LIKED: () => ({
    message: 'Liked!',
    variant: 'pin' as const,
    duration: 2000,
  }),
  PIN_UNLIKED: () => ({
    message: 'Removed from likes',
    variant: 'pin' as const,
    duration: 2000,
  }),

  // Upload operations
  UPLOAD_STARTED: () => ({
    message: 'Uploading...',
    variant: 'upload' as const,
  }),
  UPLOAD_SUCCESS: () => ({
    message: 'Upload complete',
    variant: 'upload' as const,
  }),
  UPLOAD_ERROR: (filename?: string) => ({
    message: 'Upload failed',
    description: filename ? `Could not upload "${filename}"` : undefined,
    variant: 'upload' as const,
  }),

  // Download operations
  DOWNLOAD_STARTED: () => ({
    message: 'Downloading...',
    variant: 'download' as const,
  }),
  DOWNLOAD_SUCCESS: () => ({
    message: 'Downloaded!',
    variant: 'download' as const,
  }),

  // Copy operations
  COPIED_LINK: () => ({
    message: 'Link copied!',
    description: 'Ready to share',
    variant: 'copy' as const,
    duration: 2500,
  }),
  COPIED_TEXT: () => ({
    message: 'Copied to clipboard',
    variant: 'copy' as const,
    duration: 2500,
  }),

  // Profile operations
  PROFILE_UPDATED: () => ({
    message: 'Profile updated',
    description: 'Changes saved successfully',
    variant: 'update' as const,
  }),
  AVATAR_UPDATED: () => ({
    message: 'Avatar updated',
    variant: 'update' as const,
  }),

  // Auth operations
  LOGGED_IN: (username?: string) => ({
    message: username ? `Welcome back, ${username}!` : 'Welcome back!',
    variant: 'auth' as const,
  }),
  LOGGED_OUT: () => ({
    message: 'Logged out',
    description: 'See you next time!',
    variant: 'auth' as const,
  }),
  SESSION_EXPIRED: () => ({
    message: 'Session expired',
    description: 'Please log in again',
    variant: 'auth' as const,
  }),

  // Generic operations
  SAVED: () => ({
    message: 'Saved!',
    variant: 'save' as const,
  }),
  DELETED: () => ({
    message: 'Deleted',
    variant: 'delete' as const,
  }),
  UPDATED: () => ({
    message: 'Updated',
    variant: 'update' as const,
  }),

  // Error presets
  NETWORK_ERROR: () => ({
    message: 'Connection problem',
    description: 'Check your internet connection',
  }),
  SERVER_ERROR: () => ({
    message: 'Something went wrong',
    description: 'Please try again later',
  }),
  PERMISSION_DENIED: () => ({
    message: 'Access denied',
    description: "You don't have permission for this action",
  }),
  NOT_FOUND: (item = 'Item') => ({
    message: `${item} not found`,
  }),
  VALIDATION_ERROR: (field?: string) => ({
    message: 'Invalid input',
    description: field ? `Please check the ${field} field` : undefined,
  }),
} as const;

// ============ Promise Toast Options ============
export interface PromiseToastOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((err: Error) => string);
}

// ============ Store ============
interface ToastState {
  toasts: Toast[];
  maxToasts: number;
  pausedToasts: Set<string>;
}

interface ToastActions {
  addToast: (toast: Omit<Toast, 'id'> & { replace?: boolean }) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
  setProgress: (id: string, progress: number) => void;
  
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  loading: (message: string, options?: ToastOptions) => string;
  
  promise: <T>(promise: Promise<T>, options: PromiseToastOptions<T>) => Promise<T>;
}

type ToastStore = ToastState & ToastActions;

const DEFAULT_MAX_TOASTS = 5;
const DEFAULT_DURATION = TIME.TOAST_DURATION;
const LOADING_DURATION = 0;
const ERROR_DURATION = 6000;

// Store timeout IDs for cleanup
const toastTimeouts = new Map<string, NodeJS.Timeout>();

export const useToastStore = create<ToastStore>()(
  devtools(
    (set, get) => ({
      toasts: [],
      maxToasts: DEFAULT_MAX_TOASTS,
      pausedToasts: new Set(),

      addToast: (toastInput) => {
        const { replace, ...toast } = toastInput;
        const id = generateId();
        
        const duration = toast.type === 'loading' 
          ? LOADING_DURATION 
          : (toast.duration ?? DEFAULT_DURATION);
        
        const newToast: Toast = {
          id,
          dismissible: toast.type !== 'loading',
          timestamp: Date.now(),
          ...toast,
          duration,
        };

        set((state) => {
          let updatedToasts = [...state.toasts];
          
          // Replace existing toast with same groupId if requested
          if (replace && toast.groupId) {
            const existingIndex = updatedToasts.findIndex(
              t => t.groupId === toast.groupId
            );
            if (existingIndex !== -1) {
              const oldToast = updatedToasts[existingIndex];
              // TS Check: Ensure object exists before accessing properties
              if (oldToast) {
                const oldId = oldToast.id;
                const timeout = toastTimeouts.get(oldId);
                if (timeout) {
                  clearTimeout(timeout);
                  toastTimeouts.delete(oldId);
                }
                updatedToasts.splice(existingIndex, 1);
              }
            }
          }
          
          updatedToasts.push(newToast);
          
          // Remove oldest toasts if exceeding max
          if (updatedToasts.length > state.maxToasts) {
            const removed = updatedToasts.slice(0, updatedToasts.length - state.maxToasts);
            removed.forEach(t => {
              const timeout = toastTimeouts.get(t.id);
              if (timeout) {
                clearTimeout(timeout);
                toastTimeouts.delete(t.id);
              }
            });
            updatedToasts = updatedToasts.slice(-state.maxToasts);
          }
          
          return { toasts: updatedToasts };
        }, false, 'addToast');

        // Auto remove after duration (if not loading)
        if (duration > 0) {
          const timeout = setTimeout(() => {
            if (!get().pausedToasts.has(id)) {
              get().removeToast(id);
            }
          }, duration);
          toastTimeouts.set(id, timeout);
        }

        return id;
      },

      removeToast: (id) => {
        // Clear timeout
        const timeout = toastTimeouts.get(id);
        if (timeout) {
          clearTimeout(timeout);
          toastTimeouts.delete(id);
        }
        
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
          pausedToasts: new Set([...state.pausedToasts].filter(pId => pId !== id)),
        }), false, 'removeToast');
      },

      clearToasts: () => {
        // Clear all timeouts
        toastTimeouts.forEach((timeout) => clearTimeout(timeout));
        toastTimeouts.clear();
        
        set({ toasts: [], pausedToasts: new Set() }, false, 'clearToasts');
      },

      updateToast: (id, updates) => {
        set((state) => ({
          toasts: state.toasts.map((toast) =>
            toast.id === id ? { ...toast, ...updates } : toast
          ),
        }), false, 'updateToast');
      },

      pauseToast: (id) => {
        set((state) => ({
          pausedToasts: new Set([...state.pausedToasts, id]),
        }), false, 'pauseToast');
      },

      resumeToast: (id) => {
        const toast = get().toasts.find(t => t.id === id);
        if (!toast) return;
        
        set((state) => ({
          pausedToasts: new Set([...state.pausedToasts].filter(pId => pId !== id)),
        }), false, 'resumeToast');
        
        // Set new timeout for remaining duration (use half of original for resumed)
        if (toast.duration && toast.duration > 0) {
          const existingTimeout = toastTimeouts.get(id);
          if (existingTimeout) clearTimeout(existingTimeout);
          
          const newTimeout = setTimeout(() => {
            get().removeToast(id);
          }, toast.duration / 2);
          toastTimeouts.set(id, newTimeout);
        }
      },

      setProgress: (id, progress) => {
        get().updateToast(id, { progress: Math.min(100, Math.max(0, progress)) });
      },

      // ============ Convenience Methods ============
      success: (message, options) => {
        return get().addToast({ type: 'success', message, ...options });
      },

      error: (message, options) => {
        return get().addToast({ 
          type: 'error', 
          message, 
          duration: ERROR_DURATION,
          ...options 
        });
      },

      warning: (message, options) => {
        return get().addToast({ 
          type: 'warning', 
          message, 
          duration: 5000, 
          ...options 
        });
      },

      info: (message, options) => {
        return get().addToast({ type: 'info', message, ...options });
      },

      loading: (message, options) => {
        return get().addToast({ 
          type: 'loading', 
          message, 
          dismissible: false,
          ...options 
        });
      },

      // ============ Promise-based Toast ============
      promise: async <T>(
        promise: Promise<T>, 
        options: PromiseToastOptions<T>
      ): Promise<T> => {
        const id = get().loading(options.loading);
        
        try {
          const data = await promise;
          
          // Compute success message
          let successMessage: string;
          if (typeof options.success === 'function') {
            successMessage = options.success(data);
          } else {
            successMessage = options.success;
          }
            
          get().updateToast(id, {
            type: 'success',
            message: successMessage ?? 'Success',
            dismissible: true,
            duration: DEFAULT_DURATION,
          });
          
          // Schedule removal
          setTimeout(() => get().removeToast(id), DEFAULT_DURATION);
          
          return data;
        } catch (err: unknown) {
          // Safely convert error to Error instance
          const error = err instanceof Error ? err : new Error(String(err));
          
          // Compute error message
          let errorMessage: string;
          if (typeof options.error === 'function') {
            errorMessage = options.error(error);
          } else {
            errorMessage = options.error;
          }
            
          get().updateToast(id, {
            type: 'error',
            message: errorMessage ?? 'Something went wrong',
            dismissible: true,
            duration: ERROR_DURATION,
          });
          
          // Schedule removal
          setTimeout(() => get().removeToast(id), ERROR_DURATION);
          
          throw error;
        }
      },
    }),
    { name: 'ToastStore' }
  )
);

// ============ Selectors ============
export const selectToasts = (state: ToastStore) => state.toasts;
export const selectHasToasts = (state: ToastStore) => state.toasts.length > 0;
export const selectToastById = (id: string) => (state: ToastStore) => 
  state.toasts.find(t => t.id === id);

export default useToastStore;