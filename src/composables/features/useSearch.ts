// src/composables/features/useSearch.ts
/**
 * useSearch - Search composable
 *
 * Комбинирует pins.store и tags.store для поиска
 */

import { ref, computed, watch, onUnmounted } from 'vue'
import { usePinsStore } from '@/stores/pins.store'
import { useTagsStore } from '@/stores/tags.store'
import { useRecentSearches } from '@/composables/utils/useLocalStorage'
import type { PinFilter, PinWithBlob } from '@/types'

export interface UseSearchOptions {
  debounceDelay?: number
  autoSearch?: boolean
  minQueryLength?: number
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceDelay = 300, autoSearch = true, minQueryLength = 2 } = options

  const pinsStore = usePinsStore()

  // State
  const query = ref('')
  const filter = ref<PinFilter>({ scope: 'ALL' })
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  // Computed
  const results = computed<PinWithBlob[]>(() => pinsStore.feedPins)
  const isSearching = computed(() => pinsStore.isLoading)
  const hasResults = computed(() => results.value.length > 0)
  const totalResults = computed(() => pinsStore.totalElements)

  // Search function
  const search = async (searchQuery?: string) => {
    const q = (searchQuery ?? query.value).trim()

    // Don't search if query too short (unless we have tag filters)
    if (q.length < minQueryLength && !filter.value.tags?.length) {
      return []
    }

    return await pinsStore.fetchPins({
      ...filter.value,
      q: q || undefined,
    })
  }

  // Debounced search
  const debouncedSearch = (q: string) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    debounceTimer = setTimeout(() => {
      if (q.trim().length >= minQueryLength) {
        search(q)
      }
    }, debounceDelay)
  }

  // Set filter
  const setFilter = (newFilter: Partial<PinFilter>) => {
    filter.value = { ...filter.value, ...newFilter }
  }

  // Clear filter
  const clearFilter = () => {
    filter.value = { scope: 'ALL' }
  }

  // Reset everything
  const reset = () => {
    query.value = ''
    filter.value = { scope: 'ALL' }
    pinsStore.resetFeed()
  }

  // Auto-search on query change
  if (autoSearch) {
    watch(query, (q) => {
      debouncedSearch(q)
    })
  }

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return {
    // State
    query,
    filter,

    // Computed
    results,
    isSearching,
    hasResults,
    totalResults,

    // Actions
    search,
    setFilter,
    clearFilter,
    reset,
  }
}

/**
 * useSearchSuggestions - Tag autocomplete
 */
export function useSearchSuggestions(debounceDelay = 200) {
  const tagsStore = useTagsStore()

  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  const suggestions = computed(() => tagsStore.searchResults)
  const isSearching = computed(() => tagsStore.isSearching)

  const search = (query: string, limit = 8) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    if (!query.trim()) {
      tagsStore.clearSearchResults()
      return
    }

    debounceTimer = setTimeout(async () => {
      await tagsStore.searchTags(query, limit)
    }, debounceDelay)
  }

  const clear = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    tagsStore.clearSearchResults()
  }

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return { suggestions, isSearching, search, clear }
}

/**
 * useSearchWithHistory - Search с историей
 */
export function useSearchWithHistory(options: UseSearchOptions = {}) {
  const searchComposable = useSearch(options)
  const { searches, add, remove, clear: clearHistory } = useRecentSearches()

  const searchAndSave = async (query?: string) => {
    const q = (query ?? searchComposable.query.value).trim()
    if (q) {
      add(q)
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
