// src/stores/tags.store.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Tag, Category } from '@/types'
import { tagsApi } from '@/api'

export const useTagsStore = defineStore('tags', () => {
  // ============ STATE ============

  const allTags = ref<Tag[]>([])
  const tagsCache = reactive(new Map<string, Tag>())
  const pinTagsCache = reactive(new Map<string, Tag[]>())
  const categories = ref<Category[]>([])
  const searchResults = ref<Tag[]>([])
  const currentPage = ref(0)
  const totalPages = ref(0)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const isSearching = ref(false)

  // ============ GETTERS ============

  const getTagById = computed(() => (tagId: string) => {
    return tagsCache.get(tagId)
  })

  const getPinTags = computed(() => (pinId: string) => {
    return pinTagsCache.get(pinId) || []
  })

  // ============ ACTIONS ============

  async function fetchAllTags(page = 0, size = 50, reset = false) {
    try {
      isLoading.value = true

      const response = await tagsApi.getAll({
        pageable: { page, size, sort: ['name,asc'] },
      })

      response.content.forEach((tag) => {
        tagsCache.set(tag.id, tag)
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
      console.error('[Tags] Failed to fetch tags:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTagById(tagId: string, forceReload = false) {
    try {
      if (!forceReload && tagsCache.has(tagId)) {
        return tagsCache.get(tagId)!
      }

      const tag = await tagsApi.getById(tagId)
      tagsCache.set(tagId, tag)

      return tag
    } catch (error) {
      console.error('[Tags] Failed to fetch tag:', error)
      throw error
    }
  }

  async function searchTags(query: string, limit = 10) {
    try {
      if (!query.trim()) {
        searchResults.value = []
        return []
      }

      isSearching.value = true

      const results = await tagsApi.search({ q: query, limit })

      results.forEach((tag) => {
        tagsCache.set(tag.id, tag)
      })

      searchResults.value = results
      return results
    } catch (error) {
      console.error('[Tags] Failed to search tags:', error)
      throw error
    } finally {
      isSearching.value = false
    }
  }

  async function fetchPinTags(pinId: string, forceReload = false) {
    try {
      if (!forceReload && pinTagsCache.has(pinId)) {
        return pinTagsCache.get(pinId)!
      }

      const tags = await tagsApi.getPinTags(pinId)

      tags.forEach((tag) => {
        tagsCache.set(tag.id, tag)
      })

      pinTagsCache.set(pinId, tags)
      return tags
    } catch (error) {
      console.error('[Tags] Failed to fetch pin tags:', error)
      throw error
    }
  }

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
      console.error('[Tags] Failed to fetch categories:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loadMoreTags() {
    if (!hasMore.value || isLoading.value) return
    await fetchAllTags(currentPage.value + 1, 50, false)
  }

  function clearSearchResults() {
    searchResults.value = []
  }

  function clearPinTags(pinId: string) {
    pinTagsCache.delete(pinId)
  }

  function clearAll() {
    allTags.value = []
    tagsCache.clear()
    pinTagsCache.clear()
    categories.value = []
    searchResults.value = []
    currentPage.value = 0
    totalPages.value = 0
    hasMore.value = true
  }

  return {
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
    getTagById,
    getPinTags,
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
