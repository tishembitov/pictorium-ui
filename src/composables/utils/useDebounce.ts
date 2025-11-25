// src/composables/utils/useDebounce.ts
/**
 * useDebounce - Reactive debounce
 *
 * Использует debounce из utils/helpers.ts
 * НЕТ аналога в directives
 */

import { ref, watch, customRef, type Ref, onUnmounted } from 'vue'
import { debounce, throttle } from '@/utils/helpers'

/**
 * useDebouncedRef - Debounced ref
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

  const debouncedFn = debounce((value: T) => {
    debounced.value = value
  }, delay)

  watch(source, (newValue) => debouncedFn.debounced(newValue))
  onUnmounted(() => debouncedFn.cancel())

  return debounced
}

/**
 * useDebouncedFn - Debounced функция с isPending
 */
export function useDebouncedFn<T extends (...args: any[]) => any>(fn: T, delay = 300) {
  const isPending = ref(false)

  const debouncedFn = debounce((...args: Parameters<T>) => {
    fn(...args)
    isPending.value = false
  }, delay)

  const wrappedDebounced = (...args: Parameters<T>) => {
    isPending.value = true
    debouncedFn.debounced(...args)
  }

  onUnmounted(() => debouncedFn.cancel())

  return {
    debounced: wrappedDebounced,
    cancel: () => {
      debouncedFn.cancel()
      isPending.value = false
    },
    flush: debouncedFn.flush,
    isPending,
  }
}

/**
 * useThrottle - Throttled ref
 */
export function useThrottle<T>(source: Ref<T>, limit = 300): Ref<T> {
  const throttled = ref(source.value) as Ref<T>
  const throttledFn = throttle((value: T) => {
    throttled.value = value
  }, limit)

  watch(source, throttledFn)

  return throttled
}
