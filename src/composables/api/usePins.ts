/**
 * usePins Composable (Refactored)
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePinsStore } from '@/stores/pins.store'
import { useApiCall } from '@/composables/core/useApiCall'
import type { Pin, PinFilter } from '@/types'

export interface UsePinsReturn {
  // State from store
  pins: ReturnType<typeof computed<Pin[]>>
  currentFilter: ReturnType<typeof computed<PinFilter>>
  isLoading: ReturnType<typeof computed<boolean>>
  isLoadingMore: ReturnType<typeof computed<boolean>>
  hasMore: ReturnType<typeof computed<boolean>>
  currentPage: ReturnType<typeof computed<number>>
  totalPages: ReturnType<typeof computed<number>>
  totalElements: ReturnType<typeof computed<number>>

  // Actions
  fetchPins: (filter?: PinFilter, page?: number, size?: number) => Promise<Pin[]>
  fetchPinById: (pinId: string, forceReload?: boolean) => Promise<Pin>
  createPin: (data: {
    file: File
    title?: string
    description?: string
    href?: string
    tags?: string[]
    rgb?: string
  }) => Promise<Pin>
  updatePin: (
    pinId: string,
    data: {
      title?: string
      description?: string
      href?: string
      tags?: string[]
    },
  ) => Promise<Pin>
  deletePin: (pinId: string) => Promise<void>
  likePin: (pinId: string) => Promise<void>
  unlikePin: (pinId: string) => Promise<void>
  savePin: (pinId: string) => Promise<void>
  unsavePin: (pinId: string) => Promise<void>
  searchByTag: (tagName: string, page?: number) => Promise<Pin[]>
  searchByQuery: (query: string, page?: number) => Promise<Pin[]>
  fetchRelatedPins: (pinId: string, page?: number) => Promise<Pin[]>
  resetFeed: () => void
  getPinById: (pinId: string) => Pin | undefined
}

/**
 * usePins - Main pins composable
 */
export function usePins(): UsePinsReturn {
  const pinsStore = usePinsStore()

  const {
    feedPins: pins,
    currentFilter,
    isLoading,
    isLoadingMore,
    hasMore,
    currentPage,
    totalPages,
    totalElements,
  } = storeToRefs(pinsStore)

  // Fetch Pins
  const { execute: fetchPins } = useApiCall(
    async (filter?: PinFilter, page = 0, size = 15) => {
      return await pinsStore.fetchPins(filter, page, size)
    },
    { showErrorToast: true, errorMessage: 'Failed to load pins' },
  )

  // Fetch Pin by ID
  const { execute: fetchPinById } = useApiCall(
    async (pinId: string, forceReload = false) => {
      return await pinsStore.fetchPinById(pinId, forceReload)
    },
    { showErrorToast: true, errorMessage: 'Failed to load pin' },
  )

  // Create Pin
  const { execute: createPin } = useApiCall(
    async (data: {
      file: File
      title?: string
      description?: string
      href?: string
      tags?: string[]
      rgb?: string
    }) => {
      return await pinsStore.createPin(data)
    },
    {
      showSuccessToast: true,
      successMessage: 'Pin created!',
      showErrorToast: true,
      errorMessage: 'Failed to create pin',
    },
  )

  // Update Pin
  const { execute: updatePin } = useApiCall(
    async (
      pinId: string,
      data: {
        title?: string
        description?: string
        href?: string
        tags?: string[]
      },
    ) => {
      return await pinsStore.updatePin(pinId, data)
    },
    {
      showSuccessToast: true,
      successMessage: 'Pin updated!',
      showErrorToast: true,
      errorMessage: 'Failed to update pin',
    },
  )

  // Delete Pin
  const { execute: deletePin } = useApiCall(
    async (pinId: string) => {
      await pinsStore.deletePin(pinId)
    },
    {
      showSuccessToast: true,
      successMessage: 'Pin deleted!',
      showErrorToast: true,
      errorMessage: 'Failed to delete pin',
    },
  )

  // Like Pin
  const { execute: likePin } = useApiCall(
    async (pinId: string) => {
      await pinsStore.likePin(pinId)
    },
    { showErrorToast: true, errorMessage: 'Failed to like pin' },
  )

  // Unlike Pin
  const { execute: unlikePin } = useApiCall(
    async (pinId: string) => {
      await pinsStore.unlikePin(pinId)
    },
    { showErrorToast: true, errorMessage: 'Failed to unlike pin' },
  )

  // Save Pin
  const { execute: savePin } = useApiCall(
    async (pinId: string) => {
      await pinsStore.savePin(pinId)
    },
    {
      showSuccessToast: true,
      successMessage: 'Pin saved!',
      showErrorToast: true,
      errorMessage: 'Failed to save pin',
    },
  )

  // Unsave Pin
  const { execute: unsavePin } = useApiCall(
    async (pinId: string) => {
      await pinsStore.unsavePin(pinId)
    },
    {
      showSuccessToast: true,
      successMessage: 'Pin unsaved!',
      showErrorToast: true,
      errorMessage: 'Failed to unsave pin',
    },
  )

  // Search by Tag
  const { execute: searchByTag } = useApiCall(
    async (tagName: string, page = 0) => {
      return await pinsStore.searchByTag(tagName, page)
    },
    { showErrorToast: true, errorMessage: 'Failed to search by tag' },
  )

  // Search by Query
  const { execute: searchByQuery } = useApiCall(
    async (query: string, page = 0) => {
      return await pinsStore.searchByQuery(query, page)
    },
    { showErrorToast: true, errorMessage: 'Failed to search pins' },
  )

  // Fetch Related Pins
  const { execute: fetchRelatedPins } = useApiCall(
    async (pinId: string, page = 0) => {
      return await pinsStore.fetchRelatedPins(pinId, page)
    },
    { showErrorToast: true, errorMessage: 'Failed to load related pins' },
  )

  const resetFeed = () => pinsStore.resetFeed()
  const getPinById = (pinId: string) => pinsStore.getPinById(pinId)

  return {
    // State
    pins: computed(() => pins.value),
    currentFilter: computed(() => currentFilter.value),
    isLoading: computed(() => isLoading.value),
    isLoadingMore: computed(() => isLoadingMore.value),
    hasMore: computed(() => hasMore.value),
    currentPage: computed(() => currentPage.value),
    totalPages: computed(() => totalPages.value),
    totalElements: computed(() => totalElements.value),

    // Actions
    fetchPins: async (filter, page, size) => (await fetchPins(filter, page, size)) || [],
    fetchPinById: async (pinId, forceReload) => (await fetchPinById(pinId, forceReload))!,
    createPin: async (data) => (await createPin(data))!,
    updatePin: async (pinId, data) => (await updatePin(pinId, data))!,
    deletePin: async (pinId) => {
      await deletePin(pinId)
    },
    likePin: async (pinId) => {
      await likePin(pinId)
    },
    unlikePin: async (pinId) => {
      await unlikePin(pinId)
    },
    savePin: async (pinId) => {
      await savePin(pinId)
    },
    unsavePin: async (pinId) => {
      await unsavePin(pinId)
    },
    searchByTag: async (tagName, page) => (await searchByTag(tagName, page)) || [],
    searchByQuery: async (query, page) => (await searchByQuery(query, page)) || [],
    fetchRelatedPins: async (pinId, page) => (await fetchRelatedPins(pinId, page)) || [],
    resetFeed,
    getPinById,
  }
}

/**
 * usePinActions - Actions для отдельного пина
 */
export function usePinActions(pinId: string | (() => string)) {
  const { likePin, unlikePin, savePin, unsavePin, deletePin } = usePins()

  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  return {
    like: () => likePin(getId()),
    unlike: () => unlikePin(getId()),
    save: () => savePin(getId()),
    unsave: () => unsavePin(getId()),
    remove: () => deletePin(getId()),
  }
}

/**
 * usePinDetail - Для детальной страницы пина
 */
export function usePinDetail(pinId: string | (() => string)) {
  const { fetchPinById, fetchRelatedPins, getPinById } = usePins()
  const { isLoading, execute: loadPin } = useApiCall(fetchPinById)
  const {
    isLoading: isLoadingRelated,
    execute: loadRelated,
    data: relatedPins,
  } = useApiCall(fetchRelatedPins)

  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  const pin = computed(() => getPinById(getId()) || null)

  const fetchPin = async (forceReload = false) => {
    await loadPin(getId(), forceReload)
  }

  const fetchRelated = async () => {
    await loadRelated(getId())
  }

  return {
    pin,
    relatedPins: computed(() => relatedPins.value || []),
    isLoading,
    isLoadingRelated,
    fetchPin,
    fetchRelated,
  }
}
