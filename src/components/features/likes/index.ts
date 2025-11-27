// src/components/features/likes/index.ts

/**
 * Likes Feature Components
 *
 * Компоненты для работы с лайками:
 * - Кнопка лайка с анимацией
 * - Модальное окно со списком лайков
 * - Popover со списком лайков
 * - Элемент пользователя в списке лайков
 */

// Кнопка лайка
export { default as PinLikeButton } from './PinLikeButton.vue'

// Отображение списка лайков
export { default as PinLikesModal } from './PinLikesModal.vue'
export { default as PinLikesPopover } from './PinLikesPopover.vue'

// Элемент списка
export { default as LikeUserItem } from './LikeUserItem.vue'

// Re-export types
export type { PinLikeButtonProps } from './PinLikeButton.vue'
export type { PinLikesModalProps } from './PinLikesModal.vue'
export type { PinLikesPopoverProps } from './PinLikesPopover.vue'
export type { LikeUserItemProps } from './LikeUserItem.vue'
