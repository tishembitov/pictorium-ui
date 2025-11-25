// src/composables/features/usePagination.ts
/**
 * usePagination - Classic pagination (не infinite scroll)
 *
 * Уникальный composable для страничной навигации
 */

import { ref, computed, type Ref } from 'vue'

export interface UsePaginationOptions<T> {
  fetchPage: (
    page: number,
    size: number,
  ) => Promise<{
    items: T[]
    total: number
    totalPages: number
  }>
  pageSize?: number
  initialPage?: number
  onPageChange?: (page: number) => void
}

export function usePagination<T>(options: UsePaginationOptions<T>) {
  const { fetchPage, pageSize = 10, initialPage = 0, onPageChange } = options

  const items = ref<T[]>([]) as Ref<T[]>
  const currentPage = ref(initialPage)
  const totalItems = ref(0)
  const totalPages = ref(0)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const hasNext = computed(() => currentPage.value < totalPages.value - 1)
  const hasPrev = computed(() => currentPage.value > 0)

  const loadPage = async (page: number) => {
    if (page < 0 || (totalPages.value > 0 && page >= totalPages.value)) return

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

  const goTo = (page: number) => loadPage(page)
  const next = () => hasNext.value && loadPage(currentPage.value + 1)
  const prev = () => hasPrev.value && loadPage(currentPage.value - 1)
  const first = () => loadPage(0)
  const last = () => loadPage(totalPages.value - 1)
  const refresh = () => loadPage(currentPage.value)

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
    hasNext,
    hasPrev,
    goTo,
    next,
    prev,
    first,
    last,
    refresh,
  }
}

/**
 * usePaginationControls - UI helpers для пагинации
 */
export function usePaginationControls(
  currentPage: Ref<number>,
  totalPages: Ref<number>,
  maxVisible = 5,
) {
  const pages = computed(() => Array.from({ length: totalPages.value }, (_, i) => i))

  const visiblePages = computed(() => {
    const current = currentPage.value
    const total = totalPages.value

    if (total <= maxVisible) return pages.value

    const half = Math.floor(maxVisible / 2)
    let start = Math.max(0, current - half)
    let end = Math.min(total - 1, current + half)

    if (start === 0) end = Math.min(total - 1, maxVisible - 1)
    if (end === total - 1) start = Math.max(0, total - maxVisible)

    return pages.value.slice(start, end + 1)
  })

  return {
    pages,
    visiblePages,
    isFirst: computed(() => currentPage.value === 0),
    isLast: computed(() => currentPage.value === totalPages.value - 1),
    isActive: (page: number) => page === currentPage.value,
  }
}
