// src/composables/utils/useDebounce.ts
/**
 * useDebounce - Reactive debounce
 *
 * НЕТ аналога в directives - это для reactive values
 */

import { ref, watch, customRef, type Ref, onUnmounted } from 'vue'

/**
 * useDebouncedRef - Ref с debounced обновлением
 */
export function useDebouncedRef<T>(initialValue: T, delay = 300): Ref<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  let currentValue = initialValue

  return customRef<T>((track, trigger) => ({
    get() {
      track()
      return currentValue
    },
    set(newValue: T) {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        currentValue = newValue
        trigger()
      }, delay)
    },
  }))
}

/**
 * useDebounce - Debounced версия существующего ref
 */
export function useDebounce<T>(source: Ref<T>, delay = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timeout: ReturnType<typeof setTimeout> | undefined

  watch(source, (newValue) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      debounced.value = newValue
    }, delay)
  })

  onUnmounted(() => {
    if (timeout) clearTimeout(timeout)
  })

  return debounced
}

/**
 * useDebouncedFn - Debounced функция с isPending state
 */
export function useDebouncedFn<T extends (...args: unknown[]) => unknown>(fn: T, delay = 300) {
  const isPending = ref(false)
  let timeout: ReturnType<typeof setTimeout> | undefined

  const execute = (...args: Parameters<T>) => {
    isPending.value = true

    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      fn(...args)
      isPending.value = false
    }, delay)
  }

  const cancel = () => {
    if (timeout) clearTimeout(timeout)
    isPending.value = false
  }

  const flush = () => {
    // Нельзя flush без сохранённых args
    // Это упрощённая версия
    cancel()
  }

  onUnmounted(cancel)

  return {
    execute,
    cancel,
    flush,
    isPending,
  }
}

/**
 * useThrottle - Throttled ref
 */
export function useThrottle<T>(source: Ref<T>, limit = 300): Ref<T> {
  const throttled = ref(source.value) as Ref<T>
  let lastRan = 0

  watch(source, (newValue) => {
    const now = Date.now()
    if (now - lastRan >= limit) {
      throttled.value = newValue
      lastRan = now
    }
  })

  return throttled
}

/**
 * useThrottledFn - Throttled функция
 */
export function useThrottledFn<T extends (...args: unknown[]) => unknown>(fn: T, limit = 300) {
  let lastRan = 0
  let timeout: ReturnType<typeof setTimeout> | undefined

  const execute = (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastRan >= limit) {
      fn(...args)
      lastRan = now
    } else {
      // Trailing call
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(
        () => {
          fn(...args)
          lastRan = Date.now()
        },
        limit - (now - lastRan),
      )
    }
  }

  const cancel = () => {
    if (timeout) clearTimeout(timeout)
  }

  onUnmounted(cancel)

  return { execute, cancel }
}
