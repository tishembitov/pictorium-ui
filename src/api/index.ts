// src/api/index.ts

/**
 * Централизованный экспорт всех API
 */

export { boardsApi, selectedBoardApi } from './boards.api'
export { commentsApi } from './comments.api'
export { likesApi } from './likes.api'
export { pinsApi } from './pins.api'
export { savedPinsApi } from './saved-pins.api'
export { storageApi } from './storage.api'
export { subscriptionsApi } from './subscriptions.api'
export { tagsApi } from './tags.api'
export { usersApi } from './users.api'

// Re-export clients для продвинутых случаев
export { userServiceClient, contentServiceClient, storageServiceClient } from './client'

// Re-export error helpers
export {
  handleApiError,
  isAxiosError,
  getErrorStatus,
  isUnauthorizedError,
  isForbiddenError,
  isServerError,
} from './client'

/**
 * Теперь можно импортировать так:
 * import { pinsApi, boardsApi, usersApi } from '@/api'
 */
