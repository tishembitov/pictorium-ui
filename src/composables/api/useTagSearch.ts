// src/composables/api/useTagSearch.ts
/**
 * useTagSearch - Autocomplete для тегов
 */

import { ref, computed, onUnmounted } from 'vue'
import { useTagsStore } from '@/stores/tags.store'
import type { Tag } from '@/types'

export function useTagSearch(debounceDelay = 200) {
  const tagsStore = useTagsStore()

  // ✅ ДОБАВЛЕНО: debounce timer для cleanup
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  const suggestions = computed(() => tagsStore.searchResults)
  const isSearching = computed(() => tagsStore.isSearching)

  async function search(query: string, limit = 8) {
    // ✅ ИСПРАВЛЕНО: clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (!query.trim()) {
      tagsStore.clearSearchResults()
      return []
    }

    return new Promise<Tag[]>((resolve) => {
      debounceTimer = setTimeout(async () => {
        try {
          const results = await tagsStore.searchTags(query, limit)
          resolve(results)
        } catch (e) {
          console.error('[useTagSearch] Search failed:', e)
          resolve([])
        }
      }, debounceDelay)
    })
  }

  function clear() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    tagsStore.clearSearchResults()
  }

  // ✅ ДОБАВЛЕНО: cleanup
  onUnmounted(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })

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
