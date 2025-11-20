/**
 * useLocalStorage Composable
 *
 * Reactive LocalStorage с типизацией
 */

import { ref, watch, type Ref } from 'vue'
import { getFromStorage, setToStorage, removeFromStorage } from '@/utils/storage'

export interface UseLocalStorageOptions<T> {
  serializer?: {
    read: (raw: string) => T
    write: (value: T) => string
  }
  onError?: (error: Error) => void
  deep?: boolean
}

/**
 * useLocalStorage
 *
 * @example
 * ```ts
 * const theme = useLocalStorage<'light' | 'dark'>('theme', 'light')
 *
 * theme.value = 'dark' // Автоматически сохраняется в localStorage
 *
 * // С кастомным serializer
 * const user = useLocalStorage<User>('user', null, {
 *   serializer: {
 *     read: (v) => JSON.parse(v),
 *     write: (v) => JSON.stringify(v)
 *   }
 * })
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: UseLocalStorageOptions<T> = {},
): Ref<T> {
  const {
    serializer = {
      read: (v: string) => JSON.parse(v) as T,
      write: (v: T) => JSON.stringify(v),
    },
    onError = (e) => console.error('[useLocalStorage]', e),
    deep = true,
  } = options

  // Инициализация из localStorage
  const data = ref<T>(defaultValue) as Ref<T>

  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      data.value = serializer.read(raw)
    }
  } catch (error) {
    onError(error as Error)
  }

  // Watch для автосохранения
  watch(
    data,
    (newValue) => {
      try {
        if (newValue === null || newValue === undefined) {
          removeFromStorage(key)
        } else {
          const serialized = serializer.write(newValue)
          localStorage.setItem(key, serialized)
        }
      } catch (error) {
        onError(error as Error)
      }
    },
    { deep },
  )

  return data
}

/**
 * useRecentSearches
 *
 * Специализированный composable для recent searches
 *
 * @example
 * ```ts
 * const { searches, addSearch, removeSearch, clearSearches } = useRecentSearches()
 *
 * addSearch('nature')
 * removeSearch('old search')
 * ```
 */
export function useRecentSearches(maxItems: number = 10) {
  const searches = useLocalStorage<string[]>('pinterest_recent_searches', [])

  const addSearch = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return

    // Удаляем если уже есть
    searches.value = searches.value.filter((s) => s !== trimmed)

    // Добавляем в начало
    searches.value.unshift(trimmed)

    // Ограничиваем длину
    if (searches.value.length > maxItems) {
      searches.value = searches.value.slice(0, maxItems)
    }
  }

  const removeSearch = (query: string) => {
    searches.value = searches.value.filter((s) => s !== query)
  }

  const clearSearches = () => {
    searches.value = []
  }

  return {
    searches,
    addSearch,
    removeSearch,
    clearSearches,
  }
}

/**
 * useSessionStorage
 *
 * То же самое, но для sessionStorage
 *
 * @example
 * ```ts
 * const scrollPosition = useSessionStorage('scroll-pos', 0)
 * ```
 */
export function useSessionStorage<T>(
  key: string,
  defaultValue: T,
  options: UseLocalStorageOptions<T> = {},
): Ref<T> {
  const {
    serializer = {
      read: (v: string) => JSON.parse(v) as T,
      write: (v: T) => JSON.stringify(v),
    },
    onError = (e) => console.error('[useSessionStorage]', e),
    deep = true,
  } = options

  const data = ref<T>(defaultValue) as Ref<T>

  try {
    const raw = sessionStorage.getItem(key)
    if (raw !== null) {
      data.value = serializer.read(raw)
    }
  } catch (error) {
    onError(error as Error)
  }

  watch(
    data,
    (newValue) => {
      try {
        if (newValue === null || newValue === undefined) {
          sessionStorage.removeItem(key)
        } else {
          const serialized = serializer.write(newValue)
          sessionStorage.setItem(key, serialized)
        }
      } catch (error) {
        onError(error as Error)
      }
    },
    { deep },
  )

  return data
}
