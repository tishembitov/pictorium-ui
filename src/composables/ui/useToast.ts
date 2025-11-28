// src/composables/ui/useToast.ts
/**
 * useToast - Toast notifications
 *
 * Обертка над vue-toastification с типизацией
 * НЕ дублирует - plugins/toast.ts только настраивает плагин
 */

import { useToast as useVueToast } from 'vue-toastification'
import type { PluginOptions as ToastOptions } from 'vue-toastification'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ShowToastOptions {
  duration?: number
  position?: ToastOptions['position']
}

const DEFAULT_TIMEOUT = 3000

export function useToast() {
  const toast = useVueToast()

  const showToast = (message: string, type: ToastType = 'info', options: ShowToastOptions = {}) => {
    const toastOptions = {
      timeout: options.duration || DEFAULT_TIMEOUT,
      position: options.position,
    }

    toast[type](message, toastOptions)
  }

  return {
    showToast,
    success: (msg: string, opts?: ShowToastOptions) => showToast(msg, 'success', opts),
    error: (msg: string, opts?: ShowToastOptions) => showToast(msg, 'error', opts),
    warning: (msg: string, opts?: ShowToastOptions) => showToast(msg, 'warning', opts),
    info: (msg: string, opts?: ShowToastOptions) => showToast(msg, 'info', opts),
    clear: () => toast.clear(),
  }
}

/**
 * useErrorToast - Обработка ошибок
 */
export function useErrorToast() {
  const { error } = useToast()

  return {
    showError: (err: unknown, fallback = 'An error occurred') => {
      const message = err instanceof Error ? err.message : typeof err === 'string' ? err : fallback
      error(message)
    },
    showNetworkError: () => error('Network error. Please check your connection.'),
    showUnauthorizedError: () => error('You need to be logged in.'),
    showForbiddenError: () => error("You don't have permission."),
  }
}

/**
 * useSuccessToast - Предопределенные success сообщения
 */
export function useSuccessToast() {
  const { success } = useToast()

  return {
    // Pins
    pinCreated: () => success('Pin created!'),
    pinDeleted: () => success('Pin deleted!'),
    pinUpdated: () => success('Pin updated'),
    pinSaved: () => success('Pin saved!'),
    pinUnsaved: () => success('Pin removed from saved'),

    // Boards
    boardCreated: () => success('Board created!'),
    boardDeleted: () => success('Board deleted!'),

    // Comments
    commentAdded: () => success('Comment added!'),
    commentDeleted: () => success('Comment deleted!'),

    // Profile
    profileUpdated: () => success('Profile updated!'),

    // Follow
    followed: () => success('Followed!'),
    unfollowed: () => success('Unfollowed!'),

    // Generic
    copied: () => success('Copied to clipboard!'),
  }
}
