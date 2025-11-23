/**
 * useInfiniteScroll Composable
 *
 * Infinite scroll для пинов с пагинацией
 */

import { ref, computed, type Ref } from 'vue'
import { useInfiniteScroll as useInfiniteScrollBase } from '@/composables'
import type { MaybeElementRef } from '@/composables/utils/useIntersectionObserver'

export interface UseInfiniteScrollOptions<T> {
  /**
   * Функция загрузки следующей страницы
   */
  loadMore: (page: number) => Promise<T[]>

  /**
   * Начальная страница
   * @default 0
   */
  initialPage?: number

  /**
   * Расстояние от края для триггера (px)
   * @default 200
   */
  distance?: number

  /**
   * Сброс при изменении зависимостей
   */
  resetOn?: Ref<unknown>

  /**
   * Callback при успешной загрузке
   */
  onLoad?: (items: T[], page: number) => void

  /**
   * Callback при ошибке
   */
  onError?: (error: Error) => void
}

/**
 * useInfiniteScroll
 *
 * @example
 * ```ts
 * const loadMoreRef = ref<HTMLElement>()
 *
 * const { items, isLoading, hasMore, loadMore } = useInfiniteScroll(
 *   loadMoreRef,
 *   async (page) => {
 *     return await fetchPins({}, page)
 *   }
 * )
 * ```
 */
export function useInfiniteScroll<T = any>(
  target: MaybeElementRef,
  options: UseInfiniteScrollOptions<T>,
) {
  const {
    loadMore: loadMoreFn,
    initialPage = 0,
    distance = 200,
    resetOn,
    onLoad,
    onError,
  } = options

  const items = ref<T[]>([]) as Ref<T[]>
  const currentPage = ref(initialPage)
  const totalPages = ref(Infinity)
  const isLoading = ref(false)
  const hasMore = computed(() => currentPage.value < totalPages.value - 1)
  const error = ref<Error | null>(null)

  const loadMore = async () => {
    if (isLoading.value || !hasMore.value) return

    try {
      isLoading.value = true
      error.value = null

      const nextPage = currentPage.value + 1
      const newItems = await loadMoreFn(nextPage)

      items.value.push(...newItems)
      currentPage.value = nextPage

      onLoad?.(newItems, nextPage)
    } catch (err) {
      error.value = err as Error
      onError?.(err as Error)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    items.value = []
    currentPage.value = initialPage
    totalPages.value = Infinity
    error.value = null
  }

  // Setup intersection observer
  const { isLoading: isIntersecting } = useInfiniteScrollBase(target, loadMore, {
    distance,
    disabled: computed(() => !hasMore.value || isLoading.value),
  })

  // Reset on dependencies change
  if (resetOn) {
    watch(resetOn, reset)
  }

  return {
    items,
    currentPage,
    totalPages,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
  }
}

/**
 * useInfinitePins
 *
 * Специализированный infinite scroll для пинов
 *
 * @example
 * ```ts
 * const loadMoreRef = ref<HTMLElement>()
 *
 * const { pins, loadMore, hasMore } = useInfinitePins(loadMoreRef, {
 *   filter: { scope: 'ALL' }
 * })
 * ```
 */
export function useInfinitePins(
  target: MaybeElementRef,
  options: {
    filter?: PinFilter
    pageSize?: number
  } = {},
) {
  const { filter = {}, pageSize = 15 } = options
  const { fetchPins } = usePins()

  const { items, isLoading, hasMore, loadMore, reset } = useInfiniteScroll<Pin>(target, {
    loadMore: async (page) => {
      const response = await fetchPins(filter, page, pageSize)
      return response
    },
  })

  return {
    pins: items,
    isLoading,
    hasMore,
    loadMore,
    reset,
  }
}

/**
 * useInfiniteComments
 *
 * Infinite scroll для комментариев
 */
export function useInfiniteComments(
  target: MaybeElementRef,
  pinId: Ref<string> | string,
  pageSize = 10,
) {
  const { fetchComments } = useComments()
  const id = computed(() => (typeof pinId === 'string' ? pinId : pinId.value))

  const { items, isLoading, hasMore, loadMore, reset } = useInfiniteScroll<Comment>(target, {
    loadMore: async (page) => {
      await fetchComments(id.value, page, pageSize)
      return [] // fetchComments обновляет внутренний state
    },
  })

  return {
    comments: items,
    isLoading,
    hasMore,
    loadMore,
    reset,
  }
}
