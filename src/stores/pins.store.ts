// src/stores/pins.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PinResponse, PinFilter, PagePinResponse } from '@/types/api.types'
import { pinsApi } from '@/api/pins.api'
import { savedPinsApi } from '@/api/saved-pins.api'
import { likesApi } from '@/api/likes.api'
import { storageApi } from '@/api/storage.api'
import { isVideo, getImageDimensions } from '@/utils/media' // ДОБАВИТЬ ИМПОРТ

interface PinWithBlob extends PinResponse {
  imageBlobUrl?: string
  videoBlobUrl?: string
  isImage?: boolean
  isVideo?: boolean
  isGif?: boolean
}

export const usePinsStore = defineStore('pins', () => {
  // ============ STATE ============

  // Кэш пинов (key: pinId)
  const pinsCache = ref<Map<string, PinWithBlob>>(new Map())

  // Текущий фильтр
  const currentFilter = ref<PinFilter>({
    scope: 'ALL',
  })

  // Пагинация
  const currentPage = ref(0)
  const pageSize = ref(15)
  const totalPages = ref(0)
  const totalElements = ref(0)

  // Loading states
  const isLoading = ref(false)
  const isLoadingMore = ref(false)

  // Feed пины (главная страница)
  const feedPins = ref<PinWithBlob[]>([])

  // ============ GETTERS ============

  const hasMore = computed(() => currentPage.value < totalPages.value - 1)

  const getPinById = computed(() => (pinId: string) => {
    return pinsCache.value.get(pinId)
  })

  // ============ ACTIONS ============

  /**
   * Загрузка пинов с фильтром
   */
  async function fetchPins(filter?: PinFilter, page = 0, size = 15) {
    try {
      isLoading.value = page === 0
      isLoadingMore.value = page > 0

      if (filter) currentFilter.value = filter
      currentPage.value = page
      pageSize.value = size

      const response: PagePinResponse = await pinsApi.getPins(currentFilter.value, {
        page,
        size,
        sort: ['createdAt,desc'],
      })

      totalPages.value = response.totalPages
      totalElements.value = response.totalElements

      // Загружаем blob URLs для медиа
      const pinsWithBlobs = await loadPinBlobs(response.content)

      if (page === 0) {
        feedPins.value = pinsWithBlobs
      } else {
        feedPins.value.push(...pinsWithBlobs)
      }

      // Кэшируем пины
      pinsWithBlobs.forEach((pin) => {
        pinsCache.value.set(pin.id, pin)
      })

      return pinsWithBlobs
    } catch (error) {
      console.error('Failed to fetch pins:', error)
      throw error
    } finally {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }

  /**
   * Загрузка следующей страницы
   */
  async function loadMore() {
    if (!hasMore.value || isLoadingMore.value) return
    await fetchPins(currentFilter.value, currentPage.value + 1, pageSize.value)
  }

  /**
   * Загрузка одного пина
   */
  async function fetchPinById(pinId: string, forceReload = false) {
    try {
      // Проверяем кэш
      if (!forceReload && pinsCache.value.has(pinId)) {
        return pinsCache.value.get(pinId)!
      }

      const pin = await pinsApi.getPinById(pinId)
      const [pinWithBlob] = await loadPinBlobs([pin])

      pinsCache.value.set(pinId, pinWithBlob)
      return pinWithBlob
    } catch (error) {
      console.error('Failed to fetch pin:', error)
      throw error
    }
  }

  /**
   * Создание пина
   */
  async function createPin(data: {
    file: File
    title?: string
    description?: string
    href?: string
    tags?: string[]
    rgb?: string
  }) {
    try {
      isLoading.value = true

      // 1. Получаем размеры изображения/видео
      const isVideoFile = isVideo(data.file)
      let width: number | undefined
      let height: number | undefined

      if (!isVideoFile) {
        try {
          const dimensions = await getImageDimensions(data.file)
          width = dimensions.width
          height = dimensions.height
        } catch (error) {
          console.warn('Failed to get image dimensions:', error)
        }
      }

      // 2. Загружаем медиа в Storage Service
      const uploadResponse = await storageApi.uploadImage({
        file: data.file,
        category: 'pins',
        generateThumbnail: true,
        thumbnailWidth: 400,
        thumbnailHeight: 400,
      })

      // 3. Создаем пин в Content Service
      const pin = await pinsApi.create({
        imageId: uploadResponse.imageId,
        imageUrl: uploadResponse.imageUrl,
        thumbnailId: uploadResponse.thumbnailUrl ? uploadResponse.imageId : undefined,
        thumbnailUrl: uploadResponse.thumbnailUrl || undefined,
        videoPreviewId: isVideoFile ? uploadResponse.imageId : undefined,
        videoPreviewUrl: isVideoFile ? uploadResponse.imageUrl : undefined,
        title: data.title,
        description: data.description,
        href: data.href,
        rgb: data.rgb,
        width,
        height,
        fileSize: uploadResponse.size,
        contentType: uploadResponse.contentType,
        tags: data.tags && data.tags.length > 0 ? new Set(data.tags) : undefined,
      })

      // 4. Кэшируем
      const [pinWithBlob] = await loadPinBlobs([pin])
      pinsCache.value.set(pin.id, pinWithBlob)

      // 5. Добавляем в начало feed
      feedPins.value.unshift(pinWithBlob)

      return pinWithBlob
    } catch (error) {
      console.error('Failed to create pin:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  /**
   * Обновление пина
   */
  async function updatePin(
    pinId: string,
    data: {
      title?: string
      description?: string
      href?: string
      tags?: string[]
    },
  ) {
    try {
      const updated = await pinsApi.update(pinId, {
        title: data.title,
        description: data.description,
        href: data.href,
        tags: data.tags ? new Set(data.tags) : undefined,
      })

      // Обновляем кэш
      const cached = pinsCache.value.get(pinId)
      if (cached) {
        pinsCache.value.set(pinId, { ...cached, ...updated })
      }

      // Обновляем в feed
      const index = feedPins.value.findIndex((p) => p.id === pinId)
      if (index !== -1) {
        feedPins.value[index] = { ...feedPins.value[index], ...updated }
      }

      return updated
    } catch (error) {
      console.error('Failed to update pin:', error)
      throw error
    }
  }

  /**
   * Удаление пина
   */
  async function deletePin(pinId: string) {
    try {
      await pinsApi.delete(pinId)

      // Удаляем из кэша
      const cached = pinsCache.value.get(pinId)
      if (cached) {
        if (cached.imageBlobUrl) URL.revokeObjectURL(cached.imageBlobUrl)
        if (cached.videoBlobUrl) URL.revokeObjectURL(cached.videoBlobUrl)
        pinsCache.value.delete(pinId)
      }

      // Удаляем из feed
      feedPins.value = feedPins.value.filter((p) => p.id !== pinId)
    } catch (error) {
      console.error('Failed to delete pin:', error)
      throw error
    }
  }

  /**
   * Like пина
   */
  async function likePin(pinId: string) {
    try {
      await likesApi.likePin(pinId)

      // Оптимистичное обновление
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isLiked: true,
        likeCount: pin.likeCount + 1,
      }))
    } catch (error) {
      console.error('Failed to like pin:', error)
      // Откатываем
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isLiked: false,
        likeCount: pin.likeCount - 1,
      }))
      throw error
    }
  }

  /**
   * Unlike пина
   */
  async function unlikePin(pinId: string) {
    try {
      await likesApi.unlikePin(pinId)

      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isLiked: false,
        likeCount: Math.max(0, pin.likeCount - 1),
      }))
    } catch (error) {
      console.error('Failed to unlike pin:', error)
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isLiked: true,
        likeCount: pin.likeCount + 1,
      }))
      throw error
    }
  }

  /**
   * Save пина
   */
  async function savePin(pinId: string) {
    try {
      await savedPinsApi.savePin(pinId)

      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isSaved: true,
        saveCount: pin.saveCount + 1,
      }))
    } catch (error) {
      console.error('Failed to save pin:', error)
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isSaved: false,
        saveCount: pin.saveCount - 1,
      }))
      throw error
    }
  }

  /**
   * Unsave пина
   */
  async function unsavePin(pinId: string) {
    try {
      await savedPinsApi.unsavePin(pinId)

      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isSaved: false,
        saveCount: Math.max(0, pin.saveCount - 1),
      }))
    } catch (error) {
      console.error('Failed to unsave pin:', error)
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isSaved: true,
        saveCount: pin.saveCount + 1,
      }))
      throw error
    }
  }

  /**
   * Поиск по тегу
   */
  async function searchByTag(tagName: string, page = 0) {
    return fetchPins({ tags: new Set([tagName]), scope: 'ALL' }, page)
  }

  /**
   * Поиск по тексту
   */
  async function searchByQuery(query: string, page = 0) {
    return fetchPins({ q: query, scope: 'ALL' }, page)
  }

  /**
   * Related пины (похожие по тегам)
   */
  async function fetchRelatedPins(pinId: string, page = 0) {
    return fetchPins({ relatedTo: pinId, scope: 'RELATED' }, page)
  }

  /**
   * Сброс feed
   */
  function resetFeed() {
    feedPins.value = []
    currentPage.value = 0
    totalPages.value = 0
    totalElements.value = 0
  }

  // ============ HELPERS ============

  /**
   * Загрузка blob URLs для медиа
   */
  async function loadPinBlobs(pins: PinResponse[]): Promise<PinWithBlob[]> {
    return Promise.all(
      pins.map(async (pin) => {
        const pinWithBlob: PinWithBlob = { ...pin }

        try {
          if (pin.imageUrl) {
            const blob = await storageApi.downloadImage(pin.imageUrl)
            const contentType = blob.type

            pinWithBlob.imageBlobUrl = URL.createObjectURL(blob)
            pinWithBlob.isImage = true
            pinWithBlob.isGif = contentType === 'image/gif'
          } else if (pin.videoPreviewUrl) {
            const blob = await storageApi.downloadImage(pin.videoPreviewUrl)
            pinWithBlob.videoBlobUrl = URL.createObjectURL(blob)
            pinWithBlob.isVideo = true
          }
        } catch (error) {
          console.error(`Failed to load media for pin ${pin.id}:`, error)
          // Fallback image
          pinWithBlob.imageBlobUrl =
            'https://i.pinimg.com/736x/6c/a8/05/6ca805efcc51ff2366298781aecde4ae.jpg'
          pinWithBlob.isImage = true
        }

        return pinWithBlob
      }),
    )
  }

  /**
   * Обновление пина в кэше и feed
   */
  function updatePinInCache(pinId: string, updater: (pin: PinWithBlob) => PinWithBlob) {
    // Обновляем кэш
    const cached = pinsCache.value.get(pinId)
    if (cached) {
      pinsCache.value.set(pinId, updater(cached))
    }

    // Обновляем feed
    const index = feedPins.value.findIndex((p) => p.id === pinId)
    if (index !== -1) {
      feedPins.value[index] = updater(feedPins.value[index])
    }
  }

  /**
   * Cleanup blob URLs
   */
  function cleanup() {
    pinsCache.value.forEach((pin) => {
      if (pin.imageBlobUrl) URL.revokeObjectURL(pin.imageBlobUrl)
      if (pin.videoBlobUrl) URL.revokeObjectURL(pin.videoBlobUrl)
    })
    pinsCache.value.clear()
    feedPins.value = []
  }

  return {
    // State
    pinsCache,
    feedPins,
    currentFilter,
    currentPage,
    totalPages,
    totalElements,
    isLoading,
    isLoadingMore,

    // Getters
    hasMore,
    getPinById,

    // Actions
    fetchPins,
    loadMore,
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
    cleanup,
  }
})
