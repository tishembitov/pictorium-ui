// src/composables/api/useRelatedPins.ts
/**
 * useRelatedPins - Отдельный composable для related pins
 *
 * Используется когда нужны только related pins без полного usePinDetail
 */

import { computed, ref, onUnmounted } from 'vue'
import { usePinsStore } from '@/stores/pins.store'
import type { PinWithBlob } from '@/types'

export interface UseRelatedPinsOptions {
  /** Размер страницы */
  pageSize?: number
  /** Автоматически загружать при создании */
  immediate?: boolean
}

export function useRelatedPins(
  pinId: string | (() => string),
  options: UseRelatedPinsOptions = {},
) {
  const { pageSize = 15, immediate = false } = options

  const pinsStore = usePinsStore()

  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  // ============ STATE ============
  const error = ref<Error | null>(null)

  // ============ COMPUTED ============

  const pins = computed<PinWithBlob[]>(() => pinsStore.getRelatedPins(getId()))

  const isLoading = computed(() => pinsStore.isLoadingRelated)

  const hasMore = computed(() => pinsStore.hasMoreRelatedPins(getId()))

  const pagination = computed(() => pinsStore.getRelatedPinsPagination(getId()))

  const totalCount = computed(() => pagination.value.total)

  const currentPage = computed(() => pagination.value.page)

  const isEmpty = computed(() => !isLoading.value && pins.value.length === 0)

  // ============ ACTIONS ============

  async function fetch(page = 0, reset = false): Promise<PinWithBlob[]> {
    try {
      error.value = null
      return await pinsStore.fetchRelatedPins(getId(), page, pageSize, reset)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function loadMore(): Promise<PinWithBlob[]> {
    if (!hasMore.value || isLoading.value) {
      return []
    }

    try {
      error.value = null
      return await pinsStore.loadMoreRelatedPins(getId())
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function refresh(): Promise<PinWithBlob[]> {
    return await fetch(0, true)
  }

  function clear() {
    pinsStore.clearRelatedPins(getId())
  }

  // ============ LIFECYCLE ============

  // Immediate fetch if requested
  if (immediate) {
    fetch(0)
  }

  onUnmounted(() => {
    // Optionally clear on unmount
    // clear()
  })

  return {
    // Data
    pins,

    // State
    isLoading,
    hasMore,
    error,

    // Pagination info
    pagination,
    totalCount,
    currentPage,
    isEmpty,

    // Actions
    fetch,
    loadMore,
    refresh,
    clear,
  }
}

/**
 * useRelatedPinsInfinite - С infinite scroll
 */
export function useRelatedPinsInfinite(
  pinId: string | (() => string),
  options: UseRelatedPinsOptions = {},
) {
  const relatedPins = useRelatedPins(pinId, options)

  // Intersection observer trigger ref
  const triggerRef = ref<HTMLElement | null>(null)

  return {
    ...relatedPins,
    triggerRef,
  }
}
