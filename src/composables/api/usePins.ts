/**
 * usePins Composable
 *
 * Composable для работы с пинами (CRUD + Like/Save)
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePinsStore } from '@/stores/pins.store'
import type { PinFilter, Pin, PinCreateRequest, PinUpdateRequest } from '@/types'
import { useToast } from '@/composables/ui/useToast'

export interface UsePinsReturn {
  // State
  pins: ComputedRef<Pin[]>
  currentFilter: ComputedRef<PinFilter>
  isLoading: ComputedRef<boolean>
  isLoadingMore: ComputedRef<boolean>
  hasMore: ComputedRef<boolean>
  currentPage: ComputedRef<number>
  totalPages: ComputedRef<number>
  totalElements: ComputedRef<number>

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
    data: { title?: string; description?: string; href?: string; tags?: string[] },
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
 * usePins
 *
 * @example
 * ```ts
 * const {
 *   pins,
 *   isLoading,
 *   fetchPins,
 *   createPin,
 *   likePin
 * } = usePins()
 *
 * // Загрузка пинов
 * await fetchPins({ scope: 'ALL' })
 *
 * // Создание пина
 * const pin = await createPin({
 *   file,
 *   title: 'My Pin',
 *   tags: ['nature', 'landscape']
 * })
 *
 * // Лайк пина
 * await likePin(pin.id)
 * ```
 */
export function usePins(): UsePinsReturn {
  const pinsStore = usePinsStore()
  const { showToast } = useToast()

  // State
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

  // Actions
  const fetchPins = async (filter?: PinFilter, page = 0, size = 15): Promise<Pin[]> => {
    try {
      return await pinsStore.fetchPins(filter, page, size)
    } catch (error) {
      console.error('[usePins] Fetch pins failed:', error)
      showToast('Failed to load pins', 'error')
      throw error
    }
  }

  const fetchPinById = async (pinId: string, forceReload = false): Promise<Pin> => {
    try {
      return await pinsStore.fetchPinById(pinId, forceReload)
    } catch (error) {
      console.error('[usePins] Fetch pin by ID failed:', error)
      showToast('Failed to load pin', 'error')
      throw error
    }
  }

  const createPin = async (data: {
    file: File
    title?: string
    description?: string
    href?: string
    tags?: string[]
    rgb?: string
  }): Promise<Pin> => {
    try {
      const pin = await pinsStore.createPin(data)
      showToast('Pin created successfully!', 'success')
      return pin
    } catch (error) {
      console.error('[usePins] Create pin failed:', error)
      showToast('Failed to create pin', 'error')
      throw error
    }
  }

  const updatePin = async (
    pinId: string,
    data: { title?: string; description?: string; href?: string; tags?: string[] },
  ): Promise<Pin> => {
    try {
      const pin = await pinsStore.updatePin(pinId, data)
      showToast('Pin updated successfully!', 'success')
      return pin
    } catch (error) {
      console.error('[usePins] Update pin failed:', error)
      showToast('Failed to update pin', 'error')
      throw error
    }
  }

  const deletePin = async (pinId: string): Promise<void> => {
    try {
      await pinsStore.deletePin(pinId)
      showToast('Pin deleted successfully!', 'success')
    } catch (error) {
      console.error('[usePins] Delete pin failed:', error)
      showToast('Failed to delete pin', 'error')
      throw error
    }
  }

  const likePin = async (pinId: string): Promise<void> => {
    try {
      await pinsStore.likePin(pinId)
    } catch (error) {
      console.error('[usePins] Like pin failed:', error)
      showToast('Failed to like pin', 'error')
      throw error
    }
  }

  const unlikePin = async (pinId: string): Promise<void> => {
    try {
      await pinsStore.unlikePin(pinId)
    } catch (error) {
      console.error('[usePins] Unlike pin failed:', error)
      showToast('Failed to unlike pin', 'error')
      throw error
    }
  }

  const savePin = async (pinId: string): Promise<void> => {
    try {
      await pinsStore.savePin(pinId)
      showToast('Pin saved!', 'success')
    } catch (error) {
      console.error('[usePins] Save pin failed:', error)
      showToast('Failed to save pin', 'error')
      throw error
    }
  }

  const unsavePin = async (pinId: string): Promise<void> => {
    try {
      await pinsStore.unsavePin(pinId)
      showToast('Pin removed from saved', 'success')
    } catch (error) {
      console.error('[usePins] Unsave pin failed:', error)
      showToast('Failed to unsave pin', 'error')
      throw error
    }
  }

  const searchByTag = async (tagName: string, page = 0): Promise<Pin[]> => {
    try {
      return await pinsStore.searchByTag(tagName, page)
    } catch (error) {
      console.error('[usePins] Search by tag failed:', error)
      showToast('Failed to search by tag', 'error')
      throw error
    }
  }

  const searchByQuery = async (query: string, page = 0): Promise<Pin[]> => {
    try {
      return await pinsStore.searchByQuery(query, page)
    } catch (error) {
      console.error('[usePins] Search by query failed:', error)
      showToast('Failed to search', 'error')
      throw error
    }
  }

  const fetchRelatedPins = async (pinId: string, page = 0): Promise<Pin[]> => {
    try {
      return await pinsStore.fetchRelatedPins(pinId, page)
    } catch (error) {
      console.error('[usePins] Fetch related pins failed:', error)
      showToast('Failed to load related pins', 'error')
      throw error
    }
  }

  const resetFeed = (): void => {
    pinsStore.resetFeed()
  }

  const getPinById = (pinId: string): Pin | undefined => {
    return pinsStore.getPinById(pinId)
  }

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
    fetchPins,
    fetchPinById,
    createPin,
    updatePin,
    deletePin,
    likePin,
    unlikePin,
    savePin,
    unsavePin,
    searchByTag,
    searchByQuery,
    fetchRelatedPins,
    resetFeed,
    getPinById,
  }
}

/**
 * usePinActions
 *
 * Только actions для конкретного пина (для PinCard)
 *
 * @example
 * ```ts
 * const { like, unlike, save, unsave, remove } = usePinActions(pinId)
 *
 * await like()
 * await save()
 * ```
 */
export function usePinActions(pinId: Ref<string> | string) {
  const { likePin, unlikePin, savePin, unsavePin, deletePin } = usePins()

  const id = computed(() => (typeof pinId === 'string' ? pinId : pinId.value))

  const like = () => likePin(id.value)
  const unlike = () => unlikePin(id.value)
  const save = () => savePin(id.value)
  const unsave = () => unsavePin(id.value)
  const remove = () => deletePin(id.value)

  return {
    like,
    unlike,
    save,
    unsave,
    remove,
  }
}

/**
 * usePinDetail
 *
 * Для детальной страницы пина
 *
 * @example
 * ```ts
 * const { pin, isLoading, relatedPins, fetchPin, fetchRelated } = usePinDetail(pinId)
 *
 * await fetchPin()
 * await fetchRelated()
 * ```
 */
export function usePinDetail(pinId: Ref<string> | string) {
  const { fetchPinById, fetchRelatedPins } = usePins()

  const id = computed(() => (typeof pinId === 'string' ? pinId : pinId.value))
  const pin = ref<Pin | null>(null)
  const relatedPins = ref<Pin[]>([])
  const isLoading = ref(false)
  const isLoadingRelated = ref(false)

  const fetchPin = async (forceReload = false) => {
    try {
      isLoading.value = true
      pin.value = await fetchPinById(id.value, forceReload)
    } finally {
      isLoading.value = false
    }
  }

  const fetchRelated = async () => {
    try {
      isLoadingRelated.value = true
      relatedPins.value = await fetchRelatedPins(id.value)
    } finally {
      isLoadingRelated.value = false
    }
  }

  return {
    pin,
    relatedPins,
    isLoading,
    isLoadingRelated,
    fetchPin,
    fetchRelated,
  }
}
