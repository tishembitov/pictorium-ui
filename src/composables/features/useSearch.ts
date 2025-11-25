// src/composables/features/useSearch.ts
/**
 * useSearch - Search composable
 *
 * Комбинирует pins.store и tags.store для поиска
 * Добавляет debounce и suggestions
 */

import { ref, computed, watch } from 'vue'
import { usePinsStore } from '@/stores/pins.store'
import { useTagsStore } from '@/stores/tags.store'
import { useDebounce } from '@/composables/utils/useDebounce'
import { useRecentSearches } from '@/composables/utils/useLocalStorage'
import type { PinFilter, Tag } from '@/types'

export interface UseSearchOptions {
  debounceDelay?: number
  autoSearch?: boolean
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceDelay = 300, autoSearch = true } = options

  const pinsStore = usePinsStore()

  const query = ref('')
  const debouncedQuery = useDebounce(query, debounceDelay)
  const filter = ref<PinFilter>({ scope: 'ALL' })

  const results = computed(() => pinsStore.feedPins)
  const isSearching = computed(() => pinsStore.isLoading)

  const search = async (q?: string) => {
    const searchQuery = q ?? debouncedQuery.value

    if (!searchQuery.trim() && !filter.value.tags?.length) {
      return []
    }

    return await pinsStore.fetchPins({
      ...filter.value,
      q: searchQuery.trim() || undefined,
    })
  }

  const setFilter = (newFilter: Partial<PinFilter>) => {
    filter.value = { ...filter.value, ...newFilter }
  }

  const reset = () => {
    query.value = ''
    filter.value = { scope: 'ALL' }
    pinsStore.resetFeed()
  }

  // Auto-search
  if (autoSearch) {
    watch(debouncedQuery, (q) => {
      if (q.trim()) search(q)
    })
  }

  return {
    query,
    debouncedQuery,
    results,
    isSearching,
    filter,
    search,
    setFilter,
    reset,
  }
}

/**
 * useSearchSuggestions - Tag autocomplete
 */
export function useSearchSuggestions() {
  const tagsStore = useTagsStore()

  const suggestions = computed(() => tagsStore.searchResults)
  const isSearching = computed(() => tagsStore.isSearching)

  const search = async (query: string, limit = 8) => {
    if (!query.trim()) {
      tagsStore.clearSearchResults()
      return []
    }
    return await tagsStore.searchTags(query, limit)
  }

  const clear = () => tagsStore.clearSearchResults()

  return { suggestions, isSearching, search, clear }
}

/**
 * useSearchWithHistory - Search с историей
 */
export function useSearchWithHistory(options: UseSearchOptions = {}) {
  const searchComposable = useSearch(options)
  const { searches, add, remove, clear: clearHistory } = useRecentSearches()

  const searchAndSave = async (query?: string) => {
    const q = query ?? searchComposable.query.value
    if (q.trim()) {
      add(q.trim())
    }
    return await searchComposable.search(q)
  }

  return {
    ...searchComposable,
    recentSearches: searches,
    addToHistory: add,
    removeFromHistory: remove,
    clearHistory,
    searchAndSave,
  }
}
