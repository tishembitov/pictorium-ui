/**
 * usePagination - Универсальная пагинация для API
 */

import { ref, computed, type Ref } from 'vue'
import type { Pageable, Page } from '@/types'

export interface UsePaginationOptions {
  initialPage?: number
  pageSize?: number
  sort?: string[]
}

export interface UsePaginationReturn<T> {
  items: Ref<T[]>
  currentPage: Ref<number>
  pageSize: Ref<number>
  totalPages: Ref<number>
  totalElements: Ref<number>
  hasMore: Ref<boolean>
  isFirst: Ref<boolean>
  isLast: Ref<boolean>
  isEmpty: Ref<boolean>

  setPage: (response: Page<T>, append?: boolean) => void
  getPageable: () => Pageable
  nextPage: () => void
  prevPage: () => void
  reset: () => void
}

export function usePagination<T>(options: UsePaginationOptions = {}): UsePaginationReturn<T> {
  const { initialPage = 0, pageSize: initialPageSize = 20, sort = [] } = options

  const items = ref<T[]>([]) as Ref<T[]>
  const currentPage = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const totalPages = ref(0)
  const totalElements = ref(0)
  const isFirst = ref(true)
  const isLast = ref(false)
  const isEmpty = ref(true)

  const hasMore = computed(() => !isLast.value)

  const setPage = (response: Page<T>, append = false) => {
    if (append) {
      items.value.push(...response.content)
    } else {
      items.value = response.content
    }

    currentPage.value = response.number
    pageSize.value = response.size
    totalPages.value = response.totalPages
    totalElements.value = response.totalElements
    isFirst.value = response.first
    isLast.value = response.last
    isEmpty.value = response.empty
  }

  const getPageable = (): Pageable => ({
    page: currentPage.value,
    size: pageSize.value,
    sort,
  })

  const nextPage = () => {
    if (hasMore.value) {
      currentPage.value += 1
    }
  }

  const prevPage = () => {
    if (currentPage.value > 0) {
      currentPage.value -= 1
    }
  }

  const reset = () => {
    items.value = []
    currentPage.value = initialPage
    totalPages.value = 0
    totalElements.value = 0
    isFirst.value = true
    isLast.value = false
    isEmpty.value = true
  }

  return {
    items,
    currentPage,
    pageSize,
    totalPages,
    totalElements,
    hasMore,
    isFirst,
    isLast,
    isEmpty,
    setPage,
    getPageable,
    nextPage,
    prevPage,
    reset,
  }
}
