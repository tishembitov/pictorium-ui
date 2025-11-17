// src/stores/index.ts
import { createPinia } from 'pinia'
import type { App } from 'vue'

// Создаем Pinia instance
export const pinia = createPinia()

// Setup функция для регистрации в app
export function setupStores(app: App) {
  app.use(pinia)
}

// Re-export всех stores
export { useAuthStore } from './auth.store'
export { usePinsStore } from './pins.store'
export { useBoardsStore } from './boards.store'
export { useSelectedBoardStore } from './selectedBoard.store'
export { useUIStore } from './ui.store'

// Позже добавятся:
// export { useChatsStore } from './chats.store'
// export { useNotificationsStore } from './notifications.store'
// export { useSearchStore } from './search.store'

// Helper для сброса всех stores (для тестов)
export function resetAllStores() {
  const authStore = useAuthStore()
  const pinsStore = usePinsStore()
  const boardsStore = useBoardsStore()
  const selectedBoardStore = useSelectedBoardStore()
  const uiStore = useUIStore()

  authStore.$reset()
  pinsStore.cleanup()
  uiStore.closeAllModals()
}
