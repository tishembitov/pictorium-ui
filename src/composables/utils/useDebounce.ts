/**
 * useDebounce Composable
 *
 * Debounce для reactive значений и функций
 */

import { ref, watch, type Ref, customRef } from 'vue'

/**
 * useDebouncedRef
 *
 * Создает debounced версию ref
 *
 * @example
 * ```ts
 * const searchQuery = useDebouncedRef('', 300)
 *
 * watch(searchQuery, (value) => {
 *   // Вызовется через 300ms после последнего изменения
 *   console.log('Debounced value:', value)
 * })
 *
 * searchQuery.value = 'test' // Не вызовет watch сразу
 * ```
 */
export function useDebouncedRef<T>(value: T, delay: number = 300): Ref<T> {
  return customRef<T>((track, trigger) => {
    let timeout: ReturnType<typeof setTimeout> | undefined

    return {
      get() {
        track()
        return value
      },
      set(newValue: T) {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
          value = newValue
          trigger()
        }, delay)
      },
    }
  })
}

/**
 * useDebounce
 *
 * Создает debounced версию существующего ref
 *
 * @example
 * ```ts
 * const input = ref('')
 * const debouncedInput = useDebounce(input, 500)
 *
 * watch(debouncedInput, (value) => {
 *   // Вызовется через 500ms после последнего изменения input
 *   searchPins(value)
 * })
 * ```
 */
export function useDebounce<T>(source: Ref<T>, delay: number = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timeout: ReturnType<typeof setTimeout> | undefined

  watch(source, (newValue) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      debounced.value = newValue
    }, delay)
  })

  return debounced
}

/**
 * useDebouncedFn
 *
 * Создает debounced версию функции
 *
 * @example
 * ```ts
 * const search = useDebouncedFn((query: string) => {
 *   console.log('Searching:', query)
 * }, 300)
 *
 * search('test') // Выполнится через 300ms
 * search('test2') // Отменит предыдущий вызов
 * ```
 */
export function useDebouncedFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300,
): {
  debounced: (...args: Parameters<T>) => void
  cancel: () => void
  flush: () => void
  isPending: Ref<boolean>
} {
  let timeout: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Parameters<T> | undefined
  const isPending = ref(false)

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
      isPending.value = false
    }
  }

  const flush = () => {
    if (timeout && lastArgs) {
      cancel()
      fn(...lastArgs)
    }
  }

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args
    cancel()

    isPending.value = true
    timeout = setTimeout(() => {
      fn(...args)
      isPending.value = false
      timeout = undefined
    }, delay)
  }

  return {
    debounced,
    cancel,
    flush,
    isPending,
  }
}

/**
 * useThrottledFn
 *
 * Создает throttled версию функции
 *
 * @example
 * ```ts
 * const handleScroll = useThrottledFn(() => {
 *   console.log('Scroll event')
 * }, 100)
 *
 * window.addEventListener('scroll', handleScroll)
 * ```
 */
export function useThrottledFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number = 300,
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * useThrottle
 *
 * Создает throttled версию существующего ref
 *
 * @example
 * ```ts
 * const scrollY = ref(0)
 * const throttledScrollY = useThrottle(scrollY, 100)
 *
 * watch(throttledScrollY, (value) => {
 *   // Вызовется максимум раз в 100ms
 *   console.log('Throttled scroll:', value)
 * })
 * ```
 */
export function useThrottle<T>(source: Ref<T>, limit: number = 300): Ref<T> {
  const throttled = ref(source.value) as Ref<T>
  let inThrottle = false

  watch(source, (newValue) => {
    if (!inThrottle) {
      throttled.value = newValue
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  })

  return throttled
}
