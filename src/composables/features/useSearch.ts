/**
 * useSearch Composable
 *
 * Поиск пинов через PinFilter
 */

import { ref, computed, watch, type Ref } from 'vue'
import { usePins } from '../api/usePins'
import { useDebounce } from '@/composables'
import type { PinFilter, Pin, PinScope, Tag } from '@/types'
import { useTags } from '../api/useTags'
import { useLocalStorage } from '../utils/useLocalStorage'

export interface UseSearchOptions {
  debounceDelay?: number
  initialFilter?: PinFilter
  autoSearch?: boolean
}

/**
 * useSearch
 *
 * @example
 * ```ts
 * const {
 *   query,
 *   results,
 *   isSearching,
 *   search,
 *   setFilter
 * } = useSearch()
 *
 * query.value = 'nature'
 * // Автоматически выполнит поиск через debounce
 * ```
 */
export function useSearch(options: UseSearchOptions = {}) {
  const { debounceDelay = 300, initialFilter = {}, autoSearch = true } = options

  const { searchByQuery, searchByTag, fetchPins, isLoading } = usePins()

  const query = ref('')
  const debouncedQuery = useDebounce(query, debounceDelay)
  const results = ref<Pin[]>([])
  const isSearching = computed(() => isLoading.value)

  const filter = ref<PinFilter>({ ...initialFilter })

  const search = async (searchQuery?: string) => {
    const q = searchQuery || debouncedQuery.value

    if (!q.trim() && !filter.value.tags?.length) {
      results.value = []
      return
    }

    try {
      const pins = await fetchPins({
        ...filter.value,
        q: q.trim() || undefined,
        scope: filter.value.scope || 'ALL',
      })

      results.value = pins
      return pins
    } catch (error) {
      console.error('[useSearch] Search failed:', error)
      results.value = []
      throw error
    }
  }

  const searchByTags = async (tags: string[]) => {
    if (tags.length === 0) {
      results.value = []
      return
    }

    try {
      const pins = await fetchPins({
        ...filter.value,
        tags,
        scope: 'ALL',
      })

      results.value = pins
      return pins
    } catch (error) {
      console.error('[useSearch] Search by tags failed:', error)
      results.value = []
      throw error
    }
  }

  const setFilter = (newFilter: Partial<PinFilter>) => {
    filter.value = { ...filter.value, ...newFilter }
  }

  const setScope = (scope: PinScope) => {
    filter.value.scope = scope
  }

  const reset = () => {
    query.value = ''
    results.value = []
    filter.value = { ...initialFilter }
  }

  // Auto-search on query change
  if (autoSearch) {
    watch(debouncedQuery, (newQuery) => {
      if (newQuery.trim()) {
        search(newQuery)
      } else {
        results.value = []
      }
    })
  }

  return {
    query,
    debouncedQuery,
    results,
    isSearching,
    filter,
    search,
    searchByTags,
    setFilter,
    setScope,
    reset,
  }
}

/**
 * useSearchSuggestions
 *
 * Поиск с подсказками (tags autocomplete)
 *
 * @example
 * ```ts
 * const { suggestions, search } = useSearchSuggestions()
 *
 * await search('nat')
 * // suggestions.value = [{ id: '1', name: 'nature' }, ...]
 * ```
 */
export function useSearchSuggestions() {
  const { searchTags } = useTags()

  const suggestions = ref<Tag[]>([])
  const isSearching = ref(false)

  const search = async (query: string, limit = 8) => {
    if (!query.trim()) {
      suggestions.value = []
      return
    }

    try {
      isSearching.value = true
      const tags = await searchTags(query, limit)
      suggestions.value = tags
      return tags
    } finally {
      isSearching.value = false
    }
  }

  const clear = () => {
    suggestions.value = []
  }

  return {
    suggestions,
    isSearching,
    search,
    clear,
  }
}

/**
 * useRecentSearches
 *
 * История поиска
 *
 * @example
 * ```ts
 * const { searches, addSearch, removeSearch } = useRecentSearches()
 *
 * addSearch('nature')
 * // searches.value = ['nature', ...]
 * ```
 */
export function useRecentSearches(maxItems = 10) {
  const { searches, addSearch, removeSearch, clearSearches } = useLocalStorage<string[]>(
    'pinterest_recent_searches',
    [],
  )

  const add = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return

    const filtered = searches.value.filter((s: string) => s !== trimmed)
    filtered.unshift(trimmed)

    searches.value = filtered.slice(0, maxItems)
  }

  const remove = (query: string) => {
    searches.value = searches.value.filter((s: string) => s !== query)
  }

  const clear = () => {
    searches.value = []
  }

  return {
    searches,
    addSearch: add,
    removeSearch: remove,
    clearSearches: clear,
  }
}
