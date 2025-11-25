// src/composables/ui/useLoading.ts
/**
 * useLoading - Loading states
 *
 * Локальный loading state + интеграция с ui.store для глобального
 */

import { ref, computed } from 'vue'
import { useUIStore } from '@/stores/ui.store'

/**
 * useLoading - Локальный loading state
 */
export function useLoading(initial = false) {
  const isLoading = ref(initial)

  const start = () => {
    isLoading.value = true
  }
  const stop = () => {
    isLoading.value = false
  }
  const toggle = () => {
    isLoading.value = !isLoading.value
  }

  /** Wrapper с автоматическим loading */
  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    start()
    try {
      return await fn()
    } finally {
      stop()
    }
  }

  return { isLoading, start, stop, toggle, withLoading }
}

/**
 * useGlobalLoading - Глобальный loading через ui.store
 */
export function useGlobalLoading() {
  const uiStore = useUIStore()

  return {
    isLoading: computed(() => uiStore.isLoading),
    message: computed(() => uiStore.loadingMessage),
    show: (message?: string) => uiStore.showLoading(message),
    hide: () => uiStore.hideLoading(),

    /** Wrapper с глобальным loading */
    withLoading: async <T>(fn: () => Promise<T>, message?: string): Promise<T> => {
      uiStore.showLoading(message)
      try {
        return await fn()
      } finally {
        uiStore.hideLoading()
      }
    },
  }
}

/**
 * useOperationLoading - Loading для именованных операций
 */
export function useOperationLoading() {
  const uiStore = useUIStore()

  return {
    isLoading: computed(() => uiStore.isLoading),
    start: (operationId: string) => uiStore.startOperation(operationId),
    end: (operationId: string) => uiStore.endOperation(operationId),

    /** Wrapper для операции */
    withOperation: async <T>(operationId: string, fn: () => Promise<T>): Promise<T> => {
      uiStore.startOperation(operationId)
      try {
        return await fn()
      } finally {
        uiStore.endOperation(operationId)
      }
    },
  }
}

/**
 * useProgress - Progress state
 */
export function useProgress(initial = 0) {
  const progress = ref(initial)

  return {
    progress,
    set: (value: number) => {
      progress.value = Math.min(100, Math.max(0, value))
    },
    increment: (amount = 1) => {
      progress.value = Math.min(100, progress.value + amount)
    },
    reset: () => {
      progress.value = 0
    },
    isComplete: computed(() => progress.value >= 100),
  }
}
