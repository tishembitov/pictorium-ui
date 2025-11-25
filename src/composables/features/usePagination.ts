// src/composables/features/usePagination.ts
/**
 * usePagination - Classic pagination (не infinite scroll)
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
  immediate?: boolean
  onPageChange?: (page: number) => void
}

export function usePagination<T>(options: UsePaginationOptions<T>) {
  const { fetchPage, pageSize = 10, initialPage = 0, immediate = true, onPageChange } = options

  // State
  const items = ref<T[]>([]) as Ref<T[]>
  const currentPage = ref(initialPage)
  const totalItems = ref(0)
  const totalPages = ref(0)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Computed
  const hasNext = computed(() => currentPage.value < totalPages.value - 1)
  const hasPrev = computed(() => currentPage.value > 0)
  const isEmpty = computed(() => !isLoading.value && items.value.length === 0)

  // Load page
  const loadPage = async (page: number) => {
    // Validate page number
    if (page < 0) return
    if (totalPages.value > 0 && page >= totalPages.value) return
    if (isLoading.value) return

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

  // Navigation
  const goTo = (page: number) => loadPage(page)
  const next = () => hasNext.value && loadPage(currentPage.value + 1)
  const prev = () => hasPrev.value && loadPage(currentPage.value - 1)
  const first = () => loadPage(0)
  const last = () => totalPages.value > 0 && loadPage(totalPages.value - 1)
  const refresh = () => loadPage(currentPage.value)

  // Initial load (optional)
  if (immediate) {
    loadPage(initialPage)
  }

  return {
    // State
    items,
    currentPage,
    totalItems,
    totalPages,
    pageSize,
    isLoading,
    error,

    // Computed
    hasNext,
    hasPrev,
    isEmpty,

    // Actions
    goTo,
    next,
    prev,
    first,
    last,
    refresh,
    loadPage,
  }
}

/**
 * usePaginationControls - UI helpers
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

    // Adjust if at edges
    if (start === 0) {
      end = Math.min(total - 1, maxVisible - 1)
    }
    if (end === total - 1) {
      start = Math.max(0, total - maxVisible)
    }

    return pages.value.slice(start, end + 1)
  })

  const showFirstEllipsis = computed(
    () => visiblePages.value.length > 0 && visiblePages.value[0]! > 0,
  )

  const showLastEllipsis = computed(
    () =>
      visiblePages.value.length > 0 &&
      visiblePages.value[visiblePages.value.length - 1]! < totalPages.value - 1,
  )

  return {
    pages,
    visiblePages,
    showFirstEllipsis,
    showLastEllipsis,
    isFirst: computed(() => currentPage.value === 0),
    isLast: computed(() => currentPage.value === totalPages.value - 1),
    isActive: (page: number) => page === currentPage.value,
  }
}
