/**
 * usePagination Composable
 *
 * Классическая пагинация (не infinite scroll)
 */

import { ref, computed, watch, type Ref } from 'vue'

export interface UsePaginationOptions<T> {
  /**
   * Функция загрузки страницы
   */
  fetchPage: (
    page: number,
    size: number,
  ) => Promise<{
    items: T[]
    total: number
    totalPages: number
  }>

  /**
   * Размер страницы
   * @default 10
   */
  pageSize?: number

  /**
   * Начальная страница
   * @default 0
   */
  initialPage?: number

  /**
   * Callback при изменении страницы
   */
  onPageChange?: (page: number) => void
}

/**
 * usePagination
 *
 * @example
 * ```ts
 * const {
 *   items,
 *   currentPage,
 *   totalPages,
 *   goToPage,
 *   nextPage,
 *   prevPage
 * } = usePagination({
 *   fetchPage: async (page, size) => {
 *     const response = await fetchPins({}, page, size)
 *     return {
 *       items: response.content,
 *       total: response.totalElements,
 *       totalPages: response.totalPages
 *     }
 *   }
 * })
 * ```
 */
export function usePagination<T = any>(options: UsePaginationOptions<T>) {
  const { fetchPage, pageSize = 10, initialPage = 0, onPageChange } = options

  const items = ref<T[]>([]) as Ref<T[]>
  const currentPage = ref(initialPage)
  const totalItems = ref(0)
  const totalPages = ref(0)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const hasNextPage = computed(() => currentPage.value < totalPages.value - 1)
  const hasPrevPage = computed(() => currentPage.value > 0)

  const loadPage = async (page: number) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await fetchPage(page, pageSize)

      items.value = response.items
      totalItems.value = response.total
      totalPages.value = response.totalPages
      currentPage.value = page

      onPageChange?.(page)
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const goToPage = async (page: number) => {
    if (page < 0 || page >= totalPages.value) return
    await loadPage(page)
  }

  const nextPage = async () => {
    if (hasNextPage.value) {
      await loadPage(currentPage.value + 1)
    }
  }

  const prevPage = async () => {
    if (hasPrevPage.value) {
      await loadPage(currentPage.value - 1)
    }
  }

  const firstPage = async () => {
    await loadPage(0)
  }

  const lastPage = async () => {
    await loadPage(totalPages.value - 1)
  }

  const refresh = async () => {
    await loadPage(currentPage.value)
  }

  // Initial load
  loadPage(initialPage)

  return {
    items,
    currentPage,
    totalItems,
    totalPages,
    pageSize,
    isLoading,
    error,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    refresh,
  }
}

/**
 * usePaginationControls
 *
 * UI controls для пагинации
 *
 * @example
 * ```ts
 * const {
 *   pages,
 *   visiblePages,
 *   isFirstPage,
 *   isLastPage
 * } = usePaginationControls(currentPage, totalPages)
 * ```
 */
export function usePaginationControls(
  currentPage: Ref<number>,
  totalPages: Ref<number>,
  maxVisible = 5,
) {
  const pages = computed(() => {
    return Array.from({ length: totalPages.value }, (_, i) => i)
  })

  const visiblePages = computed(() => {
    const current = currentPage.value
    const total = totalPages.value

    if (total <= maxVisible) {
      return pages.value
    }

    const half = Math.floor(maxVisible / 2)
    let start = current - half
    let end = current + half

    if (start < 0) {
      start = 0
      end = maxVisible - 1
    }

    if (end >= total) {
      end = total - 1
      start = total - maxVisible
    }

    return pages.value.slice(start, end + 1)
  })

  const isFirstPage = computed(() => currentPage.value === 0)
  const isLastPage = computed(() => currentPage.value === totalPages.value - 1)
  const isActivePage = (page: number) => page === currentPage.value

  return {
    pages,
    visiblePages,
    isFirstPage,
    isLastPage,
    isActivePage,
  }
}
