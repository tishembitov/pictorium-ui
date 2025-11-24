// src/stores/index.ts
import { createPinia } from 'pinia'
import type { App } from 'vue'

export const pinia = createPinia()

export function setupStores(app: App) {
  app.use(pinia)
}

// Re-export all stores
export { useAuthStore } from './auth.store'
export { useUserStore } from './user.store'
export { usePinsStore } from './pins.store'
export { useBoardsStore } from './boards.store'
export { useSelectedBoardStore } from './selectedBoard.store'
export { useCommentsStore } from './comments.store'
export { useSubscriptionsStore } from './subscriptions.store'
export { useTagsStore } from './tags.store'
export { useUIStore } from './ui.store'

// Позже добавятся:
// export { useChatsStore } from './chats.store'
// export { useNotificationsStore } from './notifications.store'
// export { useSearchStore } from './search.store'
