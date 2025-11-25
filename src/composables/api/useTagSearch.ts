// src/composables/api/useTagSearch.ts
/**
 * useTagSearch - Autocomplete для тегов
 */

import { ref, computed } from 'vue'
import { useTagsStore } from '@/stores/tags.store'
import type { Tag } from '@/types'

export function useTagSearch() {
  const tagsStore = useTagsStore()

  const suggestions = computed(() => tagsStore.searchResults)
  const isSearching = computed(() => tagsStore.isSearching)

  async function search(query: string, limit = 8) {
    if (!query.trim()) {
      tagsStore.clearSearchResults()
      return []
    }
    return await tagsStore.searchTags(query, limit)
  }

  function clear() {
    tagsStore.clearSearchResults()
  }

  return {
    suggestions,
    isSearching,
    search,
    clear,
  }
}

/**
 * useCategories - Категории для главной страницы
 */
export function useCategories() {
  const tagsStore = useTagsStore()

  const categories = computed(() => tagsStore.categories)
  const isLoading = computed(() => tagsStore.isLoading)

  async function fetch(limit = 12) {
    return await tagsStore.fetchCategories(limit)
  }

  return {
    categories,
    isLoading,
    fetch,
  }
}
