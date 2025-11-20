/**
 * useConfirm Composable
 *
 * Диалоги подтверждения
 */

import { ref, type Ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

interface ConfirmState {
  isOpen: boolean
  options: ConfirmOptions | null
  resolve: ((value: boolean) => void) | null
}

const confirmState: Ref<ConfirmState> = ref({
  isOpen: false,
  options: null,
  resolve: null,
})

/**
 * useConfirm
 *
 * Programmatic confirm dialog
 *
 * @example
 * ```ts
 * const { confirm, confirmState } = useConfirm()
 *
 * const result = await confirm({
 *   title: 'Delete Pin',
 *   message: 'Are you sure you want to delete this pin?',
 *   confirmText: 'Delete',
 *   type: 'danger'
 * })
 *
 * if (result) {
 *   await deletePin(pinId)
 * }
 * ```
 */
export function useConfirm() {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmState.value = {
        isOpen: true,
        options: {
          title: options.title || 'Confirm',
          message: options.message,
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          type: options.type || 'info',
        },
        resolve,
      }
    })
  }

  const handleConfirm = async () => {
    const { resolve, options } = confirmState.value

    if (options?.onConfirm) {
      await options.onConfirm()
    }

    confirmState.value.isOpen = false
    resolve?.(true)
  }

  const handleCancel = () => {
    const { resolve, options } = confirmState.value

    if (options?.onCancel) {
      options.onCancel()
    }

    confirmState.value.isOpen = false
    resolve?.(false)
  }

  return {
    confirm,
    confirmState,
    handleConfirm,
    handleCancel,
  }
}

/**
 * useDeleteConfirm
 *
 * Предопределенный confirm для удаления
 *
 * @example
 * ```ts
 * const { confirmDelete } = useDeleteConfirm()
 *
 * const confirmed = await confirmDelete('pin')
 * if (confirmed) {
 *   await deletePin(pinId)
 * }
 * ```
 */
export function useDeleteConfirm() {
  const { confirm } = useConfirm()

  const confirmDelete = (itemType: string, itemName?: string): Promise<boolean> => {
    const message = itemName
      ? `Are you sure you want to delete "${itemName}"?`
      : `Are you sure you want to delete this ${itemType}?`

    return confirm({
      title: `Delete ${itemType}`,
      message: `${message} This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    })
  }

  const confirmDeletePin = (pinTitle?: string): Promise<boolean> => {
    return confirmDelete('pin', pinTitle)
  }

  const confirmDeleteBoard = (boardTitle?: string): Promise<boolean> => {
    return confirmDelete('board', boardTitle)
  }

  const confirmDeleteComment = (): Promise<boolean> => {
    return confirmDelete('comment')
  }

  return {
    confirmDelete,
    confirmDeletePin,
    confirmDeleteBoard,
    confirmDeleteComment,
  }
}

/**
 * useUnsavedChangesConfirm
 *
 * Confirm для несохраненных изменений
 *
 * @example
 * ```ts
 * const { confirmLeave } = useUnsavedChangesConfirm()
 *
 * // В router guard или beforeUnmount
 * if (hasUnsavedChanges.value) {
 *   const canLeave = await confirmLeave()
 *   if (!canLeave) return false
 * }
 * ```
 */
export function useUnsavedChangesConfirm() {
  const { confirm } = useConfirm()

  const confirmLeave = (): Promise<boolean> => {
    return confirm({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave?',
      confirmText: 'Leave',
      cancelText: 'Stay',
      type: 'warning',
    })
  }

  const confirmDiscard = (): Promise<boolean> => {
    return confirm({
      title: 'Discard Changes',
      message: 'Are you sure you want to discard all changes?',
      confirmText: 'Discard',
      cancelText: 'Keep Editing',
      type: 'warning',
    })
  }

  return {
    confirmLeave,
    confirmDiscard,
  }
}

/**
 * useLogoutConfirm
 *
 * Confirm для выхода из аккаунта
 */
export function useLogoutConfirm() {
  const { confirm } = useConfirm()

  const confirmLogout = (): Promise<boolean> => {
    return confirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      type: 'info',
    })
  }

  return {
    confirmLogout,
  }
}
