// src/composables/utils/useScrollRestore.ts
/**
 * useScrollRestore - Сохранение и восстановление scroll position
 *
 * Для KeepAlive компонентов
 */

import { onActivated, onDeactivated, onMounted, ref } from 'vue'
import { useUIStore } from '@/stores/ui.store'

export function useScrollRestore(key: string) {
  const uiStore = useUIStore()

  // Save on deactivate
  onDeactivated(() => {
    uiStore.saveScrollPosition(key, window.scrollY)
  })

  // Restore on activate
  onActivated(() => {
    const position = uiStore.getScrollPosition(key)
    if (position > 0) {
      // Delay to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, position)
      })
    }
  })

  return {
    save: () => uiStore.saveScrollPosition(key, window.scrollY),
    restore: () => {
      const position = uiStore.getScrollPosition(key)
      window.scrollTo(0, position)
    },
    clear: () => uiStore.clearScrollPosition(key),
  }
}

/**
 * useScrollToTop - Прокрутка вверх при монтировании
 */
export function useScrollToTop(smooth = true) {
  onMounted(() => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto',
    })
  })
}
