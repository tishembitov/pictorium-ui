// src/components/features/comments/index.ts

/**
 * Comments Feature Components
 *
 * Компоненты для работы с комментариями:
 * - Отображение списка комментариев
 * - Добавление/удаление комментариев
 * - Ответы на комментарии
 * - Лайки комментариев
 * - Загрузка медиа в комментарии
 */

// Основной контейнер комментариев
export { default as PinComments } from './PinComments.vue'

// Список и элементы комментариев
export { default as CommentList } from './CommentList.vue'
export { default as CommentItem } from './CommentItem.vue'

// Ответы на комментарии
export { default as CommentReplies } from './CommentReplies.vue'
export { default as CommentReplyItem } from './CommentReplyItem.vue'

// Ввод комментариев
export { default as CommentInput } from './CommentInput.vue'
export { default as CommentMediaUpload } from './CommentMediaUpload.vue'

// Действия и взаимодействия
export { default as CommentActions } from './CommentActions.vue'
export { default as CommentLikesPopover } from './CommentLikesPopover.vue'

// Re-export types
export type { CommentInputProps } from './CommentInput.vue'
export type { CommentItemProps } from './CommentItem.vue'
export type { CommentListProps } from './CommentList.vue'
export type { CommentRepliesProps } from './CommentReplies.vue'
export type { CommentReplyItemProps } from './CommentReplyItem.vue'
export type { CommentMediaUploadProps } from './CommentMediaUpload.vue'
export type { CommentLikesPopoverProps } from './CommentLikesPopover.vue'
export type { PinCommentsProps } from './PinComments.vue'
