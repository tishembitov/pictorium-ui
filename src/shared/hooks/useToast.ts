// src/shared/hooks/useToast.ts
import { useCallback, useMemo } from 'react';
import { 
  useToastStore, 
  TOAST_PRESETS,
  type ToastOptions,
} from '../stores/toastStore';

/**
 * Enhanced hook for using toasts with convenience methods and presets
 */
export function useToast() {
  const toasts = useToastStore((state) => state.toasts);
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);
  const clearToasts = useToastStore((state) => state.clearToasts);
  const updateToast = useToastStore((state) => state.updateToast);
  const pauseToast = useToastStore((state) => state.pauseToast);
  const resumeToast = useToastStore((state) => state.resumeToast);
  const setProgress = useToastStore((state) => state.setProgress);
  const promiseToast = useToastStore((state) => state.promise);

  // ============ Base Methods ============
  const success = useCallback(
    (message: string, options?: ToastOptions) => {
      return addToast({ type: 'success', message, ...options });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: ToastOptions) => {
      return addToast({ type: 'error', message, duration: 6000, ...options });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: ToastOptions) => {
      return addToast({ type: 'warning', message, duration: 5000, ...options });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: ToastOptions) => {
      return addToast({ type: 'info', message, ...options });
    },
    [addToast]
  );

  const loading = useCallback(
    (message: string, options?: ToastOptions) => {
      return addToast({ 
        type: 'loading', 
        message, 
        dismissible: false, 
        ...options 
      });
    },
    [addToast]
  );

  const dismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  // ============ Pin Operations ============
  const pinSaved = useCallback(
    (boardName?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.PIN_SAVED(boardName);
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const pinRemoved = useCallback(
    (boardName?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.PIN_REMOVED(boardName);
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const pinCreated = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.PIN_CREATED();
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const pinUpdated = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.PIN_UPDATED();
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const pinDeleted = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.PIN_DELETED();
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const pinLiked = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.PIN_LIKED();
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const pinUnliked = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.PIN_UNLIKED();
      return addToast({ type: 'info', ...preset, ...options });
    },
    [addToast]
  );

  const pinsSaved = useCallback(
    (count: number, boardName?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.PINS_SAVED(count, boardName);
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  // ============ Board Operations ============
  const boardCreated = useCallback(
    (name?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.BOARD_CREATED(name);
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const boardUpdated = useCallback(
    (name?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.BOARD_UPDATED(name);
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const boardDeleted = useCallback(
    (name?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.BOARD_DELETED(name);
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const boardSelected = useCallback(
    (name?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.BOARD_SELECTED(name);
      return addToast({ type: 'info', ...preset, ...options });
    },
    [addToast]
  );

  // ============ Follow Operations ============
  const followed = useCallback(
    (username?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.FOLLOWED(username);
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const unfollowed = useCallback(
    (username?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.UNFOLLOWED(username);
      return addToast({ type: 'info', ...preset, ...options });
    },
    [addToast]
  );

  // ============ Comment Operations ============
  const commentAdded = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.COMMENT_ADDED();
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const commentUpdated = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.COMMENT_UPDATED();
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const commentDeleted = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.COMMENT_DELETED();
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const replyAdded = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.REPLY_ADDED();
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  // ============ Copy Operations ============
  const copiedLink = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.COPIED_LINK();
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const copiedText = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.COPIED_TEXT();
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  // ============ Upload Operations ============
  const uploadStarted = useCallback(
    (filename?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.UPLOAD_STARTED(filename);
      return addToast({ type: 'loading', ...preset, ...options });
    },
    [addToast]
  );

  const uploadSuccess = useCallback(
    (filename?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.UPLOAD_SUCCESS(filename);
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const uploadError = useCallback(
    (message?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.UPLOAD_ERROR(message);
      return addToast({ type: 'error', ...preset, ...options });
    },
    [addToast]
  );

  // ============ Download Operations ============
  const downloadStarted = useCallback(
    (filename?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.DOWNLOAD_STARTED(filename);
      return addToast({ type: 'loading', ...preset, ...options });
    },
    [addToast]
  );

  const downloadSuccess = useCallback(
    (filename?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.DOWNLOAD_SUCCESS(filename);
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const downloadError = useCallback(
    (message?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.DOWNLOAD_ERROR(message);
      return addToast({ type: 'error', ...preset, ...options });
    },
    [addToast]
  );

  // ============ Profile Operations ============
  const profileUpdated = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.PROFILE_UPDATED();
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  // ============ Auth Operations ============
  const loggedIn = useCallback(
    (username?: string, options?: ToastOptions) => {
      const preset = TOAST_PRESETS.LOGGED_IN(username);
      return addToast({ type: 'success', ...preset, ...options });
    },
    [addToast]
  );

  const loggedOut = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.LOGGED_OUT();
      return addToast({ type: 'info', ...preset, ...options });
    },
    [addToast]
  );

  const sessionExpired = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.SESSION_EXPIRED();
      return addToast({ type: 'warning', ...preset, ...options });
    },
    [addToast]
  );

  // ============ Error Presets ============
  const networkError = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.NETWORK_ERROR();
      return addToast({ type: 'error', ...preset, ...options });
    },
    [addToast]
  );

  const serverError = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.SERVER_ERROR();
      return addToast({ type: 'error', ...preset, ...options });
    },
    [addToast]
  );

  const permissionDenied = useCallback(
    (options?: ToastOptions) => {
      const preset = TOAST_PRESETS.PERMISSION_DENIED();
      return addToast({ type: 'error', ...preset, ...options });
    },
    [addToast]
  );

  // ============ Undo Action ============
  const withUndo = useCallback(
    (
      message: string,
      onUndo: () => void,
      options?: ToastOptions
    ) => {
      return addToast({
        type: 'success',
        message,
        action: {
          label: 'Undo',
          onClick: onUndo,
          accessibilityLabel: 'Undo this action',
        },
        duration: 6000,
        ...options,
      });
    },
    [addToast]
  );

  // ============ Combined Toast Object ============
  const toast = useMemo(
    () => ({
      // Base methods
      success,
      error,
      warning,
      info,
      loading,
      custom: addToast,
      dismiss,
      update: updateToast,
      clear: clearToasts,
      
      // Pause/Resume
      pause: pauseToast,
      resume: resumeToast,
      
      // Progress
      setProgress,
      
      // Promise-based
      promise: promiseToast,
      
      // With undo
      withUndo,
      
      // Pin operations
      pin: {
        saved: pinSaved,
        removed: pinRemoved,
        created: pinCreated,
        updated: pinUpdated,
        deleted: pinDeleted,
        liked: pinLiked,
        unliked: pinUnliked,
        savedMultiple: pinsSaved,
      },
      
      // Board operations
      board: {
        created: boardCreated,
        updated: boardUpdated,
        deleted: boardDeleted,
        selected: boardSelected,
      },
      
      // Follow operations
      follow: {
        followed,
        unfollowed,
      },
      
      // Comment operations
      comment: {
        added: commentAdded,
        updated: commentUpdated, 
        deleted: commentDeleted,
        replied: replyAdded,
      },
      
      // Copy operations
      copy: {
        link: copiedLink,
        text: copiedText,
      },
      
      // Upload
      upload: {
        started: uploadStarted,
        success: uploadSuccess,
        error: uploadError,
      },
      
      // Download
      download: {
        started: downloadStarted,
        success: downloadSuccess,
        error: downloadError,
      },
      
      // Profile
      profile: {
        updated: profileUpdated,
      },
      
      // Auth
      auth: {
        loggedIn,
        loggedOut,
        sessionExpired,
      },
      
      // Errors
      errors: {
        network: networkError,
        server: serverError,
        permission: permissionDenied,
      },
    }),
    [
      success, error, warning, info, loading, addToast, dismiss, updateToast,
      clearToasts, pauseToast, resumeToast, setProgress, promiseToast, withUndo,
      pinSaved, pinRemoved, pinCreated, pinUpdated, pinDeleted, pinLiked, pinUnliked, pinsSaved,
      boardCreated, boardUpdated, boardDeleted, boardSelected, followed, unfollowed,
      commentAdded, commentUpdated, commentDeleted, replyAdded, copiedLink, copiedText,
      uploadStarted, uploadSuccess, uploadError, 
      downloadStarted, downloadSuccess, downloadError, 
      profileUpdated, loggedIn, loggedOut, sessionExpired, 
      networkError, serverError, permissionDenied,
    ]
  );

  return {
    toasts,
    toast,
    addToast,
    removeToast,
    clearToasts,
    updateToast,
    pauseToast,
    resumeToast,
    setProgress,
  };
}

export type { Toast, ToastType, ToastVariant, ToastOptions } from '../stores/toastStore';

export default useToast;