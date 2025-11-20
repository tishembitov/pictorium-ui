/**
 * useModal Composable
 *
 * Управление модальными окнами через UI store
 */

import { computed, type Component } from 'vue'
import { useUIStore } from '@/stores/ui.store'

export interface ModalOptions {
  component?: Component
  props?: Record<string, unknown>
  onClose?: () => void
}

/**
 * useModal
 *
 * Глобальное управление модалками
 *
 * @example
 * ```ts
 * const { openModal, closeModal, isOpen } = useModal('create-pin')
 *
 * openModal({
 *   component: CreatePinModal,
 *   props: { initialData: {} }
 * })
 * ```
 */
export function useModal(id: string) {
  const uiStore = useUIStore()

  const isOpen = computed(() => {
    const modal = uiStore.getModalById(id)
    return modal?.isOpen || false
  })

  const modalData = computed(() => {
    return uiStore.getModalById(id)
  })

  const openModal = (options: ModalOptions = {}) => {
    uiStore.openModal(id, options.component, options.props)

    // Store onClose callback
    if (options.onClose) {
      const cleanup = () => {
        options.onClose?.()
        document.removeEventListener('modal-closed', cleanup)
      }
      document.addEventListener('modal-closed', cleanup)
    }
  }

  const closeModal = () => {
    uiStore.closeModal(id)
    document.dispatchEvent(new CustomEvent('modal-closed', { detail: { id } }))
  }

  const toggleModal = () => {
    uiStore.toggleModal(id)
  }

  return {
    isOpen,
    modalData,
    openModal,
    closeModal,
    toggleModal,
  }
}

/**
 * useCreatePinModal
 *
 * Специализированная модалка создания пина
 *
 * @example
 * ```ts
 * const { open, close, isOpen } = useCreatePinModal()
 *
 * open({ boardId: '123' })
 * ```
 */
export function useCreatePinModal() {
  const { openModal, closeModal, isOpen } = useModal('create-pin')

  const open = (props?: Record<string, unknown>) => {
    openModal({ props })
  }

  const close = () => {
    closeModal()
  }

  return {
    open,
    close,
    isOpen,
  }
}

/**
 * useBoardSelectorModal
 *
 * Модалка выбора доски
 *
 * @example
 * ```ts
 * const { open, close } = useBoardSelectorModal()
 *
 * open({
 *   pinId: '123',
 *   onSelect: (boardId) => console.log('Selected:', boardId)
 * })
 * ```
 */
export function useBoardSelectorModal() {
  const { openModal, closeModal, isOpen } = useModal('board-selector')

  interface BoardSelectorProps {
    pinId: string
    onSelect?: (boardId: string) => void
  }

  const open = (props: BoardSelectorProps) => {
    openModal({ props: props as unknown as Record<string, unknown> })
  }

  const close = () => {
    closeModal()
  }

  return {
    open,
    close,
    isOpen,
  }
}

/**
 * useImagePreviewModal
 *
 * Модалка fullscreen превью изображения
 *
 * @example
 * ```ts
 * const { open, close } = useImagePreviewModal()
 *
 * open({
 *   imageUrl: 'https://example.com/image.jpg',
 *   alt: 'Pin image'
 * })
 * ```
 */
export function useImagePreviewModal() {
  const { openModal, closeModal, isOpen } = useModal('image-preview')

  interface ImagePreviewProps {
    imageUrl: string
    alt?: string
  }

  const open = (props: ImagePreviewProps) => {
    openModal({ props: props as unknown as Record<string, unknown> })
  }

  const close = () => {
    closeModal()
  }

  return {
    open,
    close,
    isOpen,
  }
}

/**
 * useLikesModal
 *
 * Модалка списка лайков
 *
 * @example
 * ```ts
 * const { open } = useLikesModal()
 *
 * open({
 *   pinId: '123',
 *   type: 'pin'
 * })
 * ```
 */
export function useLikesModal() {
  const { openModal, closeModal, isOpen } = useModal('likes')

  interface LikesModalProps {
    pinId?: string
    commentId?: string
    type: 'pin' | 'comment'
  }

  const open = (props: LikesModalProps) => {
    openModal({ props: props as unknown as Record<string, unknown> })
  }

  const close = () => {
    closeModal()
  }

  return {
    open,
    close,
    isOpen,
  }
}

/**
 * useFollowersModal
 *
 * Модалка списка подписчиков
 */
export function useFollowersModal() {
  const { openModal, closeModal, isOpen } = useModal('followers')

  interface FollowersModalProps {
    userId: string
  }

  const open = (props: FollowersModalProps) => {
    openModal({ props: props as unknown as Record<string, unknown> })
  }

  const close = () => {
    closeModal()
  }

  return {
    open,
    close,
    isOpen,
  }
}

/**
 * useFollowingModal
 *
 * Модалка списка подписок
 */
export function useFollowingModal() {
  const { openModal, closeModal, isOpen } = useModal('following')

  interface FollowingModalProps {
    userId: string
  }

  const open = (props: FollowingModalProps) => {
    openModal({ props: props as unknown as Record<string, unknown> })
  }

  const close = () => {
    closeModal()
  }

  return {
    open,
    close,
    isOpen,
  }
}

/**
 * useEditProfileModal
 *
 * Модалка редактирования профиля
 */
export function useEditProfileModal() {
  const { openModal, closeModal, isOpen } = useModal('edit-profile')

  const open = (props?: Record<string, unknown>) => {
    openModal({ props })
  }

  const close = () => {
    closeModal()
  }

  return {
    open,
    close,
    isOpen,
  }
}

/**
 * useModals
 *
 * Управление всеми модалками
 *
 * @example
 * ```ts
 * const { closeAll, isAnyOpen } = useModals()
 *
 * if (isAnyOpen.value) {
 *   closeAll()
 * }
 * ```
 */
export function useModals() {
  const uiStore = useUIStore()

  const isAnyOpen = computed(() => uiStore.isAnyModalOpen)

  const closeAll = () => {
    uiStore.closeAllModals()
  }

  return {
    isAnyOpen,
    closeAll,
  }
}
