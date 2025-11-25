// src/composables/utils/useLocalStorage.ts
/**
 * useLocalStorage - Reactive localStorage
 *
 * Расширяет utils/storage.ts с reactivity
 * НЕТ аналога в directives
 */

import { ref, watch, type Ref } from 'vue'
import { STORAGE_KEYS } from '@/utils/constants'

export interface UseStorageOptions<T> {
  serializer?: {
    read: (raw: string) => T
    write: (value: T) => string
  }
  onError?: (error: Error) => void
  deep?: boolean
}

const defaultSerializer = {
  read: <T>(raw: string): T => JSON.parse(raw),
  write: <T>(value: T): string => JSON.stringify(value),
}

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: UseStorageOptions<T> = {},
): Ref<T> {
  const { serializer = defaultSerializer, onError = console.error, deep = true } = options

  const data = ref<T>(defaultValue) as Ref<T>

  // Read
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) data.value = serializer.read(raw)
  } catch (error) {
    onError(error as Error)
  }

  // Auto-save
  watch(
    data,
    (newValue) => {
      try {
        if (newValue === null || newValue === undefined) {
          localStorage.removeItem(key)
        } else {
          localStorage.setItem(key, serializer.write(newValue))
        }
      } catch (error) {
        onError(error as Error)
      }
    },
    { deep },
  )

  return data
}

export function useSessionStorage<T>(
  key: string,
  defaultValue: T,
  options: UseStorageOptions<T> = {},
): Ref<T> {
  const { serializer = defaultSerializer, onError = console.error, deep = true } = options
  const data = ref<T>(defaultValue) as Ref<T>

  try {
    const raw = sessionStorage.getItem(key)
    if (raw !== null) data.value = serializer.read(raw)
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
          sessionStorage.setItem(key, serializer.write(newValue))
        }
      } catch (error) {
        onError(error as Error)
      }
    },
    { deep },
  )

  return data
}

export function useRecentSearches(maxItems = 10) {
  const searches = useLocalStorage<string[]>(STORAGE_KEYS.RECENT_SEARCHES, [])

  return {
    searches,
    add: (query: string) => {
      const trimmed = query.trim()
      if (!trimmed) return
      searches.value = [
        trimmed,
        ...searches.value.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, maxItems)
    },
    remove: (query: string) => {
      searches.value = searches.value.filter((s) => s !== query)
    },
    clear: () => {
      searches.value = []
    },
  }
}
