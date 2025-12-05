// src/composables/api/useSearchBase.ts
/**
 * useSearchBase - Базовый composable для поиска
 * Используется для унификации логики в useTagSearch и useUserSearch
 */

import { ref, computed, onUnmounted } from 'vue'
import { logger } from '@/utils/logger'

export interface UseSearchBaseOptions {
  debounceDelay?: number
}

export interface SearchFetcher<T> {
  search: (query: string, limit?: number) => Promise<T[]>
  clearResults: () => void
}

/**
 * Базовый composable для поиска с debounce
 */
export function useSearchBase<T>(
  fetcher: SearchFetcher<T>,
  options: UseSearchBaseOptions = {},
) {
  const { debounceDelay = 200 } = options

  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  const results = ref<T[]>([]) as { value: T[] }
  const isSearching = ref(false)
  const lastQuery = ref('')
  const error = ref<Error | null>(null)

  const hasResults = computed(() => results.value.length > 0)
  const isEmpty = computed(
    () => !isSearching.value && results.value.length === 0 && lastQuery.value !== '',
  )

  /**
   * Поиск с debounce
   */
  async function search(query: string, limit?: number): Promise<T[]> {
    const trimmed = query.trim()

    if (!trimmed) {
      clear()
      return []
    }

    if (trimmed === lastQuery.value) {
      return results.value
    }

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    lastQuery.value = trimmed
    isSearching.value = true
    error.value = null

    return new Promise<T[]>((resolve) => {
      debounceTimer = setTimeout(async () => {
        try {
          const searchResults = await fetcher.search(trimmed, limit)
          results.value = searchResults as T[]
          resolve(searchResults)
        } catch (e) {
          logger.error('Search failed:', e)
          error.value = e as Error
          results.value = [] as T[]
          resolve([])
        } finally {
          isSearching.value = false
        }
      }, debounceDelay)
    })
  }

  /**
   * Очистить результаты
   */
  function clear(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    fetcher.clearResults()
    results.value = []
    lastQuery.value = ''
    error.value = null
  }

  // Cleanup
  onUnmounted(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })

  return {
    results: computed(() => results.value),
    isSearching: computed(() => isSearching.value),
    hasResults,
    isEmpty,
    error: computed(() => error.value),
    lastQuery: computed(() => lastQuery.value),
    search,
    clear,
  }
}

