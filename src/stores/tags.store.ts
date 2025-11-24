// src/stores/tags.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tag, Category } from '@/types'
import { tagsApi } from '@/api/tags.api'

export const useTagsStore = defineStore('tags', () => {
  // ============ STATE ============

  // Все теги (для пагинации)
  const allTags = ref<Tag[]>([])

  // Кэш тегов по ID
  const tagsCache = ref<Map<string, Tag>>(new Map())

  // Теги пина (key: pinId)
  const pinTagsCache = ref<Map<string, Tag[]>>(new Map())

  // Категории (для главной страницы)
  const categories = ref<Category[]>([])

  // Результаты поиска
  const searchResults = ref<Tag[]>([])

  // Пагинация всех тегов
  const currentPage = ref(0)
  const totalPages = ref(0)
  const hasMore = ref(true)

  // Loading states
  const isLoading = ref(false)
  const isSearching = ref(false)

  // ============ GETTERS ============

  const getTagById = computed(() => (tagId: string) => {
    return tagsCache.value.get(tagId)
  })

  const getPinTags = computed(() => (pinId: string) => {
    return pinTagsCache.value.get(pinId) || []
  })

  // ============ ACTIONS ============

  /**
   * Загрузка всех тегов с пагинацией
   */
  async function fetchAllTags(page = 0, size = 50, reset = false) {
    try {
      isLoading.value = true

      const response = await tagsApi.getAll({
        pageable: { page, size, sort: ['name,asc'] },
      })

      // Кэшируем теги
      response.content.forEach((tag) => {
        tagsCache.value.set(tag.id, tag)
      })

      if (page === 0 || reset) {
        allTags.value = response.content
      } else {
        allTags.value.push(...response.content)
      }

      currentPage.value = response.number
      totalPages.value = response.totalPages
      hasMore.value = !response.last

      return response.content
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загрузка тега по ID
   */
  async function fetchTagById(tagId: string, forceReload = false) {
    try {
      // Проверяем кэш
      if (!forceReload && tagsCache.value.has(tagId)) {
        return tagsCache.value.get(tagId)!
      }

      const tag = await tagsApi.getById(tagId)
      tagsCache.value.set(tagId, tag)

      return tag
    } catch (error) {
      console.error('Failed to fetch tag:', error)
      throw error
    }
  }

  /**
   * Поиск тегов
   */
  async function searchTags(query: string, limit = 10) {
    try {
      if (!query.trim()) {
        searchResults.value = []
        return []
      }

      isSearching.value = true

      const results = await tagsApi.search({ q: query, limit })

      // Кэшируем результаты
      results.forEach((tag) => {
        tagsCache.value.set(tag.id, tag)
      })

      searchResults.value = results
      return results
    } catch (error) {
      console.error('Failed to search tags:', error)
      throw error
    } finally {
      isSearching.value = false
    }
  }

  /**
   * Загрузка тегов пина
   */
  async function fetchPinTags(pinId: string, forceReload = false) {
    try {
      // Проверяем кэш
      if (!forceReload && pinTagsCache.value.has(pinId)) {
        return pinTagsCache.value.get(pinId)!
      }

      const tags = await tagsApi.getPinTags(pinId)

      // Кэшируем теги
      tags.forEach((tag) => {
        tagsCache.value.set(tag.id, tag)
      })

      pinTagsCache.value.set(pinId, tags)
      return tags
    } catch (error) {
      console.error('Failed to fetch pin tags:', error)
      throw error
    }
  }

  /**
   * Загрузка категорий (для главной страницы)
   */
  async function fetchCategories(limit = 12, forceReload = false) {
    try {
      if (!forceReload && categories.value.length > 0) {
        return categories.value
      }

      isLoading.value = true

      const response = await tagsApi.getCategories({ limit })
      categories.value = response

      return response
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загрузка следующей страницы тегов
   */
  async function loadMoreTags() {
    if (!hasMore.value) return
    await fetchAllTags(currentPage.value + 1, 50, false)
  }

  /**
   * Очистить результаты поиска
   */
  function clearSearchResults() {
    searchResults.value = []
  }

  /**
   * Очистить кэш тегов пина
   */
  function clearPinTags(pinId: string) {
    pinTagsCache.value.delete(pinId)
  }

  /**
   * Очистить все
   */
  function clearAll() {
    allTags.value = []
    tagsCache.value.clear()
    pinTagsCache.value.clear()
    categories.value = []
    searchResults.value = []
    currentPage.value = 0
    totalPages.value = 0
    hasMore.value = true
  }

  return {
    // State
    allTags,
    tagsCache,
    pinTagsCache,
    categories,
    searchResults,
    currentPage,
    totalPages,
    hasMore,
    isLoading,
    isSearching,

    // Getters
    getTagById,
    getPinTags,

    // Actions
    fetchAllTags,
    fetchTagById,
    searchTags,
    fetchPinTags,
    fetchCategories,
    loadMoreTags,
    clearSearchResults,
    clearPinTags,
    clearAll,
  }
})
