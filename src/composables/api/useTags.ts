/**
 * useTags Composable (Refactored)
 */

import { ref, computed } from 'vue'
import { tagsApi } from '@/api/tags.api'
import { useLoadMore } from '@/composables/core/useLoadMore'
import { useApiCall } from '@/composables/core/useApiCall'
import type { Tag, Category } from '@/types'

/**
 * useTags - Работа с тегами
 */
export function useTags() {
  const categories = ref<Category[]>([])

  // Fetch All Tags
  const {
    items: tags,
    isLoading,
    load: loadTags,
    loadMore,
  } = useLoadMore({
    fetchFn: (page, size) =>
      tagsApi.getAll({
        pageable: { page, size, sort: ['name,asc'] },
      }),
    pageSize: 50,
  })

  // Fetch Tag by ID
  const { execute: fetchTagById } = useApiCall((tagId: string) => tagsApi.getById(tagId), {
    showErrorToast: true,
    errorMessage: 'Failed to load tag',
  })

  // Search Tags
  const { execute: searchTags } = useApiCall(
    (query: string, limit = 10) => tagsApi.search({ q: query, limit }),
    { showErrorToast: true, errorMessage: 'Failed to search tags' },
  )

  // Fetch Pin Tags
  const { execute: fetchPinTags } = useApiCall((pinId: string) => tagsApi.getPinTags(pinId), {
    showErrorToast: true,
    errorMessage: 'Failed to load pin tags',
  })

  // Fetch Categories
  const { execute: fetchCategories, isLoading: isLoadingCategories } = useApiCall(
    async (limit = 20) => {
      const cats = await tagsApi.getCategories({ limit })
      categories.value = cats
      return cats
    },
    { showErrorToast: true, errorMessage: 'Failed to load categories' },
  )

  return {
    tags,
    categories: computed(() => categories.value),
    isLoading,
    isLoadingCategories,
    loadTags,
    loadMore,
    fetchTagById: async (tagId: string) => (await fetchTagById(tagId))!,
    searchTags: async (query: string, limit = 10) => (await searchTags(query, limit)) || [],
    fetchPinTags: async (pinId: string) => (await fetchPinTags(pinId)) || [],
    fetchCategories: async (limit = 20) => (await fetchCategories(limit)) || [],
  }
}

/**
 * useTagSearch - Autocomplete для тегов
 */
export function useTagSearch() {
  const { searchTags } = useTags()
  const suggestions = ref<Tag[]>([])
  const { isLoading: isSearching, execute } = useApiCall(searchTags, { showErrorToast: false })

  const search = async (query: string, limit = 8) => {
    if (!query.trim()) {
      suggestions.value = []
      return []
    }

    const results = await execute(query, limit)
    suggestions.value = results || []
    return suggestions.value
  }

  const clear = () => {
    suggestions.value = []
  }

  return {
    suggestions: computed(() => suggestions.value),
    isSearching,
    search,
    clear,
  }
}
