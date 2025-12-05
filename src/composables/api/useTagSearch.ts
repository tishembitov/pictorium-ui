// src/composables/api/useTagSearch.ts
/**
 * useTagSearch - Autocomplete для тегов
 */

import { computed, ref } from 'vue'
import { useTagsStore } from '@/stores/tags.store'
import { useSearchBase } from './useSearchBase'
import type { Tag } from '@/types'

export function useTagSearch(debounceDelay = 200) {
  const tagsStore = useTagsStore()

  const searchBase = useSearchBase<Tag>(
    {
      search: async (query: string, limit = 8) => {
        return await tagsStore.searchTags(query, limit)
      },
      clearResults: () => tagsStore.clearSearchResults(),
    },
    { debounceDelay },
  )

  return {
    suggestions: computed(() => tagsStore.searchResults),
    isSearching: computed(() => tagsStore.isSearching || searchBase.isSearching.value),
    search: searchBase.search,
    clear: searchBase.clear,
  }
}

/**
 * useCategories - Категории для главной страницы
 */
export function useCategories() {
  const tagsStore = useTagsStore()

  const categories = computed(() => tagsStore.categories)
  const isLoading = computed(() => tagsStore.isLoading)
  const error = ref<Error | null>(null)

  async function fetch(limit = 12) {
    try {
      error.value = null
      return await tagsStore.fetchCategories(limit)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  return {
    categories,
    isLoading,
    error,
    fetch,
  }
}
