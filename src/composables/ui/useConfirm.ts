// src/composables/ui/useConfirm.ts
import { ref, type Ref, shallowRef } from 'vue'

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

// ✅ SSR-safe: создаём state лениво
let globalState: Ref<ConfirmState> | null = null

function getState(): Ref<ConfirmState> {
  globalState ??= ref({
    isOpen: false,
    options: null,
    resolve: null,
  })
  return globalState
}

export function useConfirm() {
  const state = getState()

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
    close()
  }

  const handleCancel = () => {
    state.value.resolve?.(false)
    close()
  }

  const close = () => {
    state.value = {
      isOpen: false,
      options: null,
      resolve: null,
    }
  }

  return {
    state,
    confirm,
    handleConfirm,
    handleCancel,
    close,
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
