// src/composables/ui/useModal.ts
/**
 * useModal - Modal management
 *
 * Использует ui.store для состояния модалок
 * Добавляет типизированные хелперы для конкретных модалок
 */

import { computed } from 'vue'
import { useUIStore } from '@/stores/ui.store'

/**
 * useModal - Базовый composable для модалки
 */
export function useModal(id: string) {
  const uiStore = useUIStore()

  const isOpen = computed(() => uiStore.getModalById(id)?.isOpen || false)

  return {
    isOpen,
    open: (props?: Record<string, unknown>) => uiStore.openModal(id, undefined, props),
    close: () => uiStore.closeModal(id),
    toggle: () => uiStore.toggleModal(id),
  }
}

/**
 * useModals - Глобальное управление модалками
 */
export function useModals() {
  const uiStore = useUIStore()

  return {
    isAnyOpen: computed(() => uiStore.isAnyModalOpen),
    closeAll: () => uiStore.closeAllModals(),
  }
}

// ============================================================================
// ТИПИЗИРОВАННЫЕ МОДАЛКИ
// ============================================================================

export function useCreatePinModal() {
  return useModal('create-pin')
}

export function useBoardSelectorModal() {
  const modal = useModal('board-selector')

  return {
    ...modal,
    open: (pinId: string, onSelect?: (boardId: string) => void) => modal.open({ pinId, onSelect }),
  }
}

export function useImagePreviewModal() {
  const modal = useModal('image-preview')

  return {
    ...modal,
    open: (imageUrl: string, alt?: string) => modal.open({ imageUrl, alt }),
  }
}

export function useLikesModal() {
  const modal = useModal('likes')

  return {
    ...modal,
    openForPin: (pinId: string) => modal.open({ pinId, type: 'pin' }),
    openForComment: (commentId: string) => modal.open({ commentId, type: 'comment' }),
  }
}

export function useFollowersModal() {
  const modal = useModal('followers')

  return {
    ...modal,
    open: (userId: string) => modal.open({ userId }),
  }
}

export function useFollowingModal() {
  const modal = useModal('following')

  return {
    ...modal,
    open: (userId: string) => modal.open({ userId }),
  }
}

export function useEditProfileModal() {
  return useModal('edit-profile')
}
