/**
 * useTags Composable
 *
 * Composable для работы с тегами
 */

import { ref, type Ref } from 'vue'
import { tagsApi } from '@/api/tags.api'
import type { Tag, Category } from '@/types'
import { useToast } from '@/composables/ui/useToast'

export interface UseTagsReturn {
  tags: Ref<Tag[]>
  categories: Ref<Category[]>
  isLoading: Ref<boolean>

  fetchAllTags: (page?: number, size?: number) => Promise<Tag[]>
  fetchTagById: (tagId: string) => Promise<Tag>
  searchTags: (query: string, limit?: number) => Promise<Tag[]>
  fetchPinTags: (pinId: string) => Promise<Tag[]>
  fetchCategories: (limit?: number) => Promise<Category[]>
}

/**
 * useTags
 *
 * @example
 * ```ts
 * const { tags, searchTags, fetchCategories } = useTags()
 *
 * // Поиск тегов
 * const results = await searchTags('nature')
 *
 * // Загрузка категорий
 * await fetchCategories()
 * ```
 */
export function useTags(): UseTagsReturn {
  const { showToast } = useToast()

  const tags = ref<Tag[]>([])
  const categories = ref<Category[]>([])
  const isLoading = ref(false)

  const fetchAllTags = async (page = 0, size = 50): Promise<Tag[]> => {
    try {
      isLoading.value = true
      const response = await tagsApi.getAll({
        pageable: { page, size, sort: ['name,asc'] },
      })

      tags.value = response.content
      return response.content
    } catch (error) {
      console.error('[useTags] Fetch all tags failed:', error)
      showToast('Failed to load tags', 'error')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchTagById = async (tagId: string): Promise<Tag> => {
    try {
      return await tagsApi.getById(tagId)
    } catch (error) {
      console.error('[useTags] Fetch tag by ID failed:', error)
      showToast('Failed to load tag', 'error')
      throw error
    }
  }

  const searchTags = async (query: string, limit = 10): Promise<Tag[]> => {
    try {
      const results = await tagsApi.search({ q: query, limit })
      return results
    } catch (error) {
      console.error('[useTags] Search tags failed:', error)
      showToast('Failed to search tags', 'error')
      throw error
    }
  }

  const fetchPinTags = async (pinId: string): Promise<Tag[]> => {
    try {
      return await tagsApi.getPinTags(pinId)
    } catch (error) {
      console.error('[useTags] Fetch pin tags failed:', error)
      showToast('Failed to load pin tags', 'error')
      throw error
    }
  }

  const fetchCategories = async (limit = 20): Promise<Category[]> => {
    try {
      isLoading.value = true
      const cats = await tagsApi.getCategories({ limit })
      categories.value = cats
      return cats
    } catch (error) {
      console.error('[useTags] Fetch categories failed:', error)
      showToast('Failed to load categories', 'error')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    tags,
    categories,
    isLoading,
    fetchAllTags,
    fetchTagById,
    searchTags,
    fetchPinTags,
    fetchCategories,
  }
}

/**
 * useTagSearch
 *
 * Для autocomplete тегов
 *
 * @example
 * ```ts
 * const { suggestions, search, isSearching } = useTagSearch()
 *
 * const results = await search('nat')
 * ```
 */
export function useTagSearch() {
  const { searchTags } = useTags()

  const suggestions = ref<Tag[]>([])
  const isSearching = ref(false)

  const search = async (query: string, limit = 8): Promise<Tag[]> => {
    if (!query.trim()) {
      suggestions.value = []
      return []
    }

    try {
      isSearching.value = true
      const results = await searchTags(query, limit)
      suggestions.value = results
      return results
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
