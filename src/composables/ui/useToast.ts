/**
 * useToast Composable
 *
 * Toast уведомления через vue-toastification
 */

import { useToast as useVueToast, type PluginOptions as ToastOptions } from 'vue-toastification'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ShowToastOptions extends Partial<ToastOptions> {
  duration?: number
  closable?: boolean
  position?: ToastOptions['position']
}

/**
 * useToast
 *
 * Wrapper для vue-toastification с нашими дефолтами
 *
 * @example
 * ```ts
 * const { showToast, success, error, warning, info } = useToast()
 *
 * success('Pin created!')
 * error('Failed to delete pin')
 * showToast('Custom message', 'info', { duration: 5000 })
 * ```
 */
export function useToast() {
  const toast = useVueToast()

  const defaultOptions: Partial<ToastOptions> = {
    timeout: 3000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: 'button',
    icon: true,
    rtl: false,
  }

  const showToast = (message: string, type: ToastType = 'info', options: ShowToastOptions = {}) => {
    const mergedOptions: ToastOptions = {
      ...defaultOptions,
      ...options,
      timeout: options.duration || defaultOptions.timeout,
    }

    switch (type) {
      case 'success':
        toast.success(message, mergedOptions)
        break
      case 'error':
        toast.error(message, mergedOptions)
        break
      case 'warning':
        toast.warning(message, mergedOptions)
        break
      case 'info':
        toast.info(message, mergedOptions)
        break
      default:
        toast(message, mergedOptions)
    }
  }

  const success = (message: string, options?: ShowToastOptions) => {
    showToast(message, 'success', options)
  }

  const error = (message: string, options?: ShowToastOptions) => {
    showToast(message, 'error', options)
  }

  const warning = (message: string, options?: ShowToastOptions) => {
    showToast(message, 'warning', options)
  }

  const info = (message: string, options?: ShowToastOptions) => {
    showToast(message, 'info', options)
  }

  const clear = () => {
    toast.clear()
  }

  return {
    showToast,
    success,
    error,
    warning,
    info,
    clear,
  }
}

/**
 * useErrorToast
 *
 * Специализированный toast для ошибок API
 *
 * @example
 * ```ts
 * const { showError, showValidationError, showNetworkError } = useErrorToast()
 *
 * try {
 *   await createPin(data)
 * } catch (error) {
 *   showError(error)
 * }
 * ```
 */
export function useErrorToast() {
  const { error: showErrorToast } = useToast()

  const showError = (err: unknown, fallbackMessage = 'An error occurred') => {
    let message = fallbackMessage

    if (err instanceof Error) {
      message = err.message
    } else if (typeof err === 'string') {
      message = err
    } else if (err && typeof err === 'object' && 'message' in err) {
      message = String(err.message)
    }

    showErrorToast(message)
  }

  const showValidationError = (errors: Record<string, string[]>) => {
    const messages = Object.values(errors).flat()
    if (messages.length > 0) {
      showErrorToast(messages[0] || '')
    }
  }

  const showNetworkError = () => {
    showErrorToast('Network error. Please check your connection.')
  }

  const showUnauthorizedError = () => {
    showErrorToast('You need to be logged in to perform this action.')
  }

  const showForbiddenError = () => {
    showErrorToast("You don't have permission to perform this action.")
  }

  return {
    showError,
    showValidationError,
    showNetworkError,
    showUnauthorizedError,
    showForbiddenError,
  }
}

/**
 * useSuccessToast
 *
 * Предопределенные success toasts
 *
 * @example
 * ```ts
 * const { pinCreated, pinDeleted, profileUpdated } = useSuccessToast()
 *
 * await createPin(data)
 * pinCreated()
 * ```
 */
export function useSuccessToast() {
  const { success } = useToast()

  return {
    // Pins
    pinCreated: () => success('Pin created successfully!'),
    pinUpdated: () => success('Pin updated successfully!'),
    pinDeleted: () => success('Pin deleted successfully!'),
    pinSaved: () => success('Pin saved!'),
    pinUnsaved: () => success('Pin removed from saved'),

    // Boards
    boardCreated: () => success('Board created successfully!'),
    boardDeleted: () => success('Board deleted successfully!'),
    pinAddedToBoard: () => success('Pin added to board!'),
    pinRemovedFromBoard: () => success('Pin removed from board!'),

    // Comments
    commentAdded: () => success('Comment added!'),
    commentUpdated: () => success('Comment updated!'),
    commentDeleted: () => success('Comment deleted!'),

    // Profile
    profileUpdated: () => success('Profile updated successfully!'),
    avatarUploaded: () => success('Avatar updated!'),
    bannerUploaded: () => success('Banner updated!'),

    // Follow
    followed: () => success('Followed!'),
    unfollowed: () => success('Unfollowed!'),

    // Generic
    saved: () => success('Saved successfully!'),
    copied: () => success('Copied to clipboard!'),
  }
}
