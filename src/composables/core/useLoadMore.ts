/**
 * useLoadMore - Infinite scroll для списков с пагинацией
 */

import { ref, type Ref } from 'vue'
import type { Page } from '@/types'
import { usePagination, type UsePaginationOptions } from './usePagination'

export interface UseLoadMoreOptions<T> extends UsePaginationOptions {
  fetchFn: (page: number, size: number) => Promise<Page<T>>
  autoLoad?: boolean
}

export interface UseLoadMoreReturn<T> {
  items: Ref<T[]>
  isLoading: Ref<boolean>
  isLoadingMore: Ref<boolean>
  hasMore: Ref<boolean>
  error: Ref<Error | null>

  load: () => Promise<void>
  loadMore: () => Promise<void>
  reset: () => void
}

export function useLoadMore<T>(options: UseLoadMoreOptions<T>): UseLoadMoreReturn<T> {
  const { fetchFn, autoLoad = false, ...paginationOptions } = options

  const pagination = usePagination<T>(paginationOptions)
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const error = ref<Error | null>(null)

  const load = async () => {
    if (isLoading.value) return

    try {
      isLoading.value = true
      error.value = null

      pagination.reset()

      const response = await fetchFn(pagination.currentPage.value, pagination.pageSize.value)

      pagination.setPage(response, false)
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const loadMore = async () => {
    if (isLoadingMore.value || !pagination.hasMore.value) return

    try {
      isLoadingMore.value = true
      error.value = null

      pagination.nextPage()

      const response = await fetchFn(pagination.currentPage.value, pagination.pageSize.value)

      pagination.setPage(response, true)
    } catch (err) {
      error.value = err as Error
      pagination.prevPage() // Откатываем страницу назад при ошибке
      throw err
    } finally {
      isLoadingMore.value = false
    }
  }

  const reset = () => {
    pagination.reset()
    isLoading.value = false
    isLoadingMore.value = false
    error.value = null
  }

  // Auto-load при инициализации
  if (autoLoad) {
    load()
  }

  return {
    items: pagination.items,
    isLoading,
    isLoadingMore,
    hasMore: pagination.hasMore,
    error,
    load,
    loadMore,
    reset,
  }
}
