/**
 * useLoading Composable
 *
 * Loading states management
 */

import { ref, computed, type Ref } from 'vue'
import { useUIStore } from '@/stores/ui.store'

export function useLoading(initialValue = false) {
  const isLoading = ref(initialValue)

  const startLoading = () => {
    isLoading.value = true
  }

  const stopLoading = () => {
    isLoading.value = false
  }

  const toggleLoading = () => {
    isLoading.value = !isLoading.value
  }

  /**
   * Wrapper функция с автоматическим loading state
   */
  const withLoading = <T extends (...args: unknown[]) => Promise<unknown>>(fn: T) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      startLoading()
      try {
        return (await fn(...args)) as ReturnType<T>
      } finally {
        stopLoading()
      }
    }
  }

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    withLoading,
  }
}

export function useGlobalLoading() {
  const uiStore = useUIStore()

  const isLoading = computed(() => uiStore.globalLoading)
  const loadingMessage = computed(() => uiStore.loadingMessage)

  const showLoading = (message = 'Loading...') => {
    uiStore.showLoading(message)
  }

  const hideLoading = () => {
    uiStore.hideLoading()
  }

  const withLoading = <T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    message = 'Loading...',
  ) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      showLoading(message)
      try {
        return (await fn(...args)) as ReturnType<T>
      } finally {
        hideLoading()
      }
    }
  }

  return {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
    withLoading,
  }
}

export function useAsyncState<T, Args extends unknown[] = unknown[]>(
  asyncFn: (...args: Args) => Promise<T>,
  initialValue?: T,
  options: {
    immediate?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  } = {},
) {
  const { immediate = false, onSuccess, onError } = options

  const state = ref<T | undefined>(initialValue) as Ref<T | undefined>
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const isReady = ref(false)

  const execute = async (...args: Args): Promise<T | undefined> => {
    isLoading.value = true
    error.value = null

    try {
      const result = await asyncFn(...args)
      state.value = result
      isReady.value = true

      onSuccess?.(result)
      return result
    } catch (err) {
      error.value = err as Error
      onError?.(err as Error)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  if (immediate) {
    execute(...([] as unknown as Args))
  }

  return {
    state,
    isLoading,
    error,
    isReady,
    execute,
  }
}

export function useLoadingStates() {
  const states = ref<Map<string, boolean>>(new Map())

  const setLoading = (key: string, value: boolean) => {
    states.value.set(key, value)
  }

  const getLoading = (key: string): boolean => {
    return states.value.get(key) || false
  }

  const isLoading = computed(() => {
    return Array.from(states.value.values()).some((v) => v)
  })

  const reset = () => {
    states.value.clear()
  }

  return {
    isLoading,
    setLoading,
    getLoading,
    reset,
  }
}

export function useProgress(initialValue = 0) {
  const progress = ref(initialValue)

  const setProgress = (value: number) => {
    progress.value = Math.min(100, Math.max(0, value))
  }

  const increment = (amount = 1) => {
    setProgress(progress.value + amount)
  }

  const reset = () => {
    progress.value = 0
  }

  const isComplete = computed(() => progress.value >= 100)

  return {
    progress,
    setProgress,
    increment,
    reset,
    isComplete,
  }
}
