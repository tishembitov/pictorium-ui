// src/composables/ui/useConfirm.ts
/**
 * useConfirm - Confirmation dialogs
 *
 * Уникальный composable - нет аналога в stores/utils
 */

import { ref, type Ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

interface ConfirmState {
  isOpen: boolean
  options: ConfirmOptions | null
  resolve: ((value: boolean) => void) | null
}

// Singleton state для глобального доступа
const state: Ref<ConfirmState> = ref({
  isOpen: false,
  options: null,
  resolve: null,
})

export function useConfirm() {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      state.value = {
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

  const handleConfirm = () => {
    state.value.resolve?.(true)
    state.value.isOpen = false
  }

  const handleCancel = () => {
    state.value.resolve?.(false)
    state.value.isOpen = false
  }

  return {
    state,
    confirm,
    handleConfirm,
    handleCancel,
  }
}

/**
 * useDeleteConfirm - Предопределенные confirm для удаления
 */
export function useDeleteConfirm() {
  const { confirm } = useConfirm()

  const confirmDelete = (itemType: string, itemName?: string) => {
    const message = itemName
      ? `Are you sure you want to delete "${itemName}"?`
      : `Are you sure you want to delete this ${itemType}?`

    return confirm({
      title: `Delete ${itemType}`,
      message: `${message} This action cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger',
    })
  }

  return {
    confirmDeletePin: (title?: string) => confirmDelete('pin', title),
    confirmDeleteBoard: (title?: string) => confirmDelete('board', title),
    confirmDeleteComment: () => confirmDelete('comment'),
  }
}

/**
 * useUnsavedChangesConfirm
 */
export function useUnsavedChangesConfirm() {
  const { confirm } = useConfirm()

  return {
    confirmLeave: () =>
      confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave?',
        confirmText: 'Leave',
        cancelText: 'Stay',
        type: 'warning',
      }),

    confirmDiscard: () =>
      confirm({
        title: 'Discard Changes',
        message: 'Are you sure you want to discard all changes?',
        confirmText: 'Discard',
        cancelText: 'Keep Editing',
        type: 'warning',
      }),
  }
}
