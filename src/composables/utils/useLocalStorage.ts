// src/composables/utils/useLocalStorage.ts
/**
 * useLocalStorage - Reactive localStorage
 */

import { ref, watch, type Ref } from 'vue'
import { STORAGE_KEYS } from '@/utils/constants'

export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  const data = ref<T>(defaultValue) as Ref<T>

  // Read initial value
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      data.value = JSON.parse(raw)
    }
  } catch (e) {
    console.warn(`[useLocalStorage] Failed to read "${key}":`, e)
  }

  // Auto-save on change
  watch(
    data,
    (newValue) => {
      try {
        if (newValue === null || newValue === undefined) {
          localStorage.removeItem(key)
        } else {
          localStorage.setItem(key, JSON.stringify(newValue))
        }
      } catch (e) {
        console.warn(`[useLocalStorage] Failed to write "${key}":`, e)
      }
    },
    { deep: true },
  )

  return data
}

export function useSessionStorage<T>(key: string, defaultValue: T): Ref<T> {
  const data = ref<T>(defaultValue) as Ref<T>

  try {
    const raw = sessionStorage.getItem(key)
    if (raw !== null) {
      data.value = JSON.parse(raw)
    }
  } catch (e) {
    console.warn(`[useSessionStorage] Failed to read "${key}":`, e)
  }

  watch(
    data,
    (newValue) => {
      try {
        if (newValue === null || newValue === undefined) {
          sessionStorage.removeItem(key)
        } else {
          sessionStorage.setItem(key, JSON.stringify(newValue))
        }
      } catch (e) {
        console.warn(`[useSessionStorage] Failed to write "${key}":`, e)
      }
    },
    { deep: true },
  )

  return data
}

/**
 * useRecentSearches - История поиска
 */
export function useRecentSearches(maxItems = 10) {
  const searches = useLocalStorage<string[]>(STORAGE_KEYS.RECENT_SEARCHES, [])

  const add = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return

    searches.value = [
      trimmed,
      ...searches.value.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, maxItems)
  }

  const remove = (query: string) => {
    searches.value = searches.value.filter((s) => s !== query)
  }

  const clear = () => {
    searches.value = []
  }

  return { searches, add, remove, clear }
}
