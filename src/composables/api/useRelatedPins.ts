// src/composables/api/useRelatedPins.ts
/**
 * useRelatedPins - Отдельный composable для related pins
 *
 * Используется когда нужны только related pins без полного usePinDetail
 * Использует usePinDetail под капотом для единообразия
 */

import { computed, ref, onUnmounted } from 'vue'
import { usePinDetail } from './usePinDetail'
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
  const { immediate = false } = options

  // Используем usePinDetail, но только для related pins
  const pinDetail = usePinDetail(pinId, {
    loadComments: false,
    loadRelated: true,
    relatedPinsSize: options.pageSize || 15,
  })

  // ============ COMPUTED ============

  const pins = computed<PinWithBlob[]>(() => pinDetail.relatedPins.value)

  const isLoading = computed(() => pinDetail.isLoadingRelated.value)

  const hasMore = computed(() => pinDetail.hasMoreRelatedPins.value)

  const pagination = computed(() => pinDetail.relatedPinsPagination.value)

  const totalCount = computed(() => pagination.value.total)

  const currentPage = computed(() => pagination.value.page)

  const isEmpty = computed(() => !isLoading.value && pins.value.length === 0)

  const error = computed(() => pinDetail.error.value)

  // ============ ACTIONS ============

  async function fetch(page = 0, reset = false): Promise<PinWithBlob[]> {
    return await pinDetail.fetchRelatedPins(page)
  }

  async function loadMore(): Promise<PinWithBlob[]> {
    return await pinDetail.loadMoreRelatedPins()
  }

  async function refresh(): Promise<PinWithBlob[]> {
    return await fetch(0, true)
  }

  function clear() {
    pinDetail.cleanup()
  }

  // ============ LIFECYCLE ============

  if (immediate) {
    fetch(0)
  }

  onUnmounted(() => {
    clear()
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
