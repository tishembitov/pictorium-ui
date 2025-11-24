// src/stores/pins.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PinResponse, PinFeed, PinWithBlob, PinFilter, PagePinResponse } from '@/types'
import { pinsApi } from '@/api/pins.api'
import { savedPinsApi } from '@/api/saved-pins.api'
import { likesApi } from '@/api/likes.api'
import { storageApi } from '@/api/storage.api'
import { isVideo, getImageDimensions } from '@/utils/media'
import { usePinMediaLoader } from '@/composables/features/usePinMediaLoader'

type FeedType = 'all' | 'created' | 'saved' | 'liked'

export const usePinsStore = defineStore('pins', () => {
  // ============ STATE ============

  // Кэш пинов по ID (единый источник правды)
  const pinsCache = ref<Map<string, PinWithBlob>>(new Map())

  const { loadPinBlob, loadPinsBlobs } = usePinMediaLoader()

  // Feeds для разных scope
  const feeds = ref<Map<FeedType, PinFeed>>(
    new Map([
      ['all', createEmptyFeed()],
      ['created', createEmptyFeed()],
      ['saved', createEmptyFeed()],
      ['liked', createEmptyFeed()],
    ]),
  )

  // Текущий активный feed
  const activeFeedType = ref<FeedType>('all')

  // Текущий фильтр
  const currentFilter = ref<PinFilter>({ scope: 'ALL' })

  // Размер страницы
  const pageSize = ref(15)

  // ============ GETTERS ============

  const activeFeed = computed(() => feeds.value.get(activeFeedType.value)!)

  const feedPins = computed(() => activeFeed.value.pins)
  const isLoading = computed(() => activeFeed.value.isLoading)
  const hasMore = computed(() => activeFeed.value.hasMore)
  const currentPage = computed(() => activeFeed.value.page)

  const getPinById = computed(() => (pinId: string) => {
    return pinsCache.value.get(pinId)
  })

  // ============ ACTIONS ============

  /**
   * Загрузка пинов с фильтром
   */
  async function fetchPins(filter?: PinFilter, page = 0, size = 15, feedType: FeedType = 'all') {
    try {
      const feed = feeds.value.get(feedType)!
      feed.isLoading = true

      if (filter) currentFilter.value = filter

      const response: PagePinResponse = await pinsApi.getPins(currentFilter.value, {
        page,
        size,
        sort: ['createdAt,desc'],
      })

      // Загружаем blob URLs
      const pinsWithBlobs = await loadPinsBlobs(response.content)

      // Кэшируем пины
      pinsWithBlobs.forEach((pin) => {
        pinsCache.value.set(pin.id, pin)
      })

      // Обновляем feed
      if (page === 0) {
        feed.pins = pinsWithBlobs
      } else {
        feed.pins.push(...pinsWithBlobs)
      }

      feed.page = response.number
      feed.totalPages = response.totalPages
      feed.totalElements = response.totalElements
      feed.hasMore = !response.last

      activeFeedType.value = feedType

      return pinsWithBlobs
    } catch (error) {
      console.error('[Pins] Failed to fetch pins:', error)
      throw error
    } finally {
      const feed = feeds.value.get(feedType)!
      feed.isLoading = false
    }
  }

  /**
   * Загрузка пина по ID
   */
  async function fetchPinById(pinId: string, forceReload = false) {
    try {
      // Проверяем кэш
      if (!forceReload && pinsCache.value.has(pinId)) {
        return pinsCache.value.get(pinId)!
      }

      const pin = await pinsApi.getById(pinId)
      const pinWithBlob = await loadPinBlob(pin)

      pinsCache.value.set(pinId, pinWithBlob)
      return pinWithBlob
    } catch (error) {
      console.error('[Pins] Failed to fetch pin:', error)
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
      // 1. Получаем размеры
      const isVideoFile = isVideo(data.file)
      let width: number | undefined
      let height: number | undefined

      if (!isVideoFile) {
        try {
          const dimensions = await getImageDimensions(data.file)
          width = dimensions.width
          height = dimensions.height
        } catch (error) {
          console.warn('[Pins] Failed to get image dimensions:', error)
        }
      }

      // 2. Загружаем медиа
      const uploadResponse = await storageApi.uploadImage({
        file: data.file,
        category: 'pins',
        generateThumbnail: true,
        thumbnailWidth: 400,
        thumbnailHeight: 400,
      })

      // 3. Создаем пин
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
        tags: data.tags,
      })

      // 4. Кэшируем
      const pinWithBlob = await loadPinBlob(pin)
      pinsCache.value.set(pin.id, pinWithBlob)

      // 5. Добавляем в feed "created" и "all"
      const createdFeed = feeds.value.get('created')!
      createdFeed.pins.unshift(pinWithBlob)

      const allFeed = feeds.value.get('all')!
      allFeed.pins.unshift(pinWithBlob)

      return pinWithBlob
    } catch (error) {
      console.error('[Pins] Failed to create pin:', error)
      throw error
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
      const updated = await pinsApi.update(pinId, data)

      // Обновляем кэш (сохраняем blob URLs)
      const cached = pinsCache.value.get(pinId)
      if (cached) {
        pinsCache.value.set(pinId, {
          ...cached,
          ...updated,
        })
      }

      return updated
    } catch (error) {
      console.error('[Pins] Failed to update pin:', error)
      throw error
    }
  }

  /**
   * Удаление пина
   */
  async function deletePin(pinId: string) {
    try {
      await pinsApi.delete(pinId)

      // Очищаем blob URLs
      const cached = pinsCache.value.get(pinId)
      if (cached) {
        cleanupPinBlobs(cached)
        pinsCache.value.delete(pinId)
      }

      // Удаляем из всех feeds
      feeds.value.forEach((feed) => {
        feed.pins = feed.pins.filter((p) => p.id !== pinId)
      })
    } catch (error) {
      console.error('[Pins] Failed to delete pin:', error)
      throw error
    }
  }

  /**
   * Лайк пина
   */
  async function likePin(pinId: string) {
    try {
      // Оптимистичное обновление
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isLiked: true,
        likeCount: pin.likeCount + 1,
      }))

      await likesApi.likePin(pinId)
    } catch (error) {
      console.error('[Pins] Failed to like pin:', error)
      // Откат
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isLiked: false,
        likeCount: Math.max(0, pin.likeCount - 1),
      }))
      throw error
    }
  }

  /**
   * Убрать лайк
   */
  async function unlikePin(pinId: string) {
    try {
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isLiked: false,
        likeCount: Math.max(0, pin.likeCount - 1),
      }))

      await likesApi.unlikePin(pinId)
    } catch (error) {
      console.error('[Pins] Failed to unlike pin:', error)
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isLiked: true,
        likeCount: pin.likeCount + 1,
      }))
      throw error
    }
  }

  /**
   * Сохранить пин
   */
  async function savePin(pinId: string) {
    try {
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isSaved: true,
        saveCount: pin.saveCount + 1,
      }))

      await savedPinsApi.save(pinId)

      // Добавляем в saved feed
      const pin = pinsCache.value.get(pinId)
      if (pin) {
        const savedFeed = feeds.value.get('saved')!
        savedFeed.pins.unshift(pin)
      }
    } catch (error) {
      console.error('[Pins] Failed to save pin:', error)
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isSaved: false,
        saveCount: Math.max(0, pin.saveCount - 1),
      }))
      throw error
    }
  }

  /**
   * Убрать из сохраненных
   */
  async function unsavePin(pinId: string) {
    try {
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isSaved: false,
        saveCount: Math.max(0, pin.saveCount - 1),
      }))

      await savedPinsApi.unsave(pinId)

      // Удаляем из saved feed
      const savedFeed = feeds.value.get('saved')!
      savedFeed.pins = savedFeed.pins.filter((p) => p.id !== pinId)
    } catch (error) {
      console.error('[Pins] Failed to unsave pin:', error)
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isSaved: true,
        saveCount: pin.saveCount + 1,
      }))
      throw error
    }
  }

  /**
   * Загрузка следующей страницы
   */
  async function loadMore() {
    const feed = activeFeed.value
    if (!feed.hasMore) return

    await fetchPins(currentFilter.value, feed.page + 1, pageSize.value, activeFeedType.value)
  }

  /**
   * Переключение feed
   */
  async function switchFeed(feedType: FeedType, filter?: PinFilter) {
    activeFeedType.value = feedType

    const feed = feeds.value.get(feedType)!

    // Если feed пустой - загружаем
    if (feed.pins.length === 0) {
      const feedFilter = filter || getFeedFilter(feedType)
      await fetchPins(feedFilter, 0, pageSize.value, feedType)
    }
  }

  /**
   * Сброс feed
   */
  function resetFeed(feedType?: FeedType) {
    if (feedType) {
      feeds.value.set(feedType, createEmptyFeed())
    } else {
      feeds.value.forEach((feed, type) => {
        feeds.value.set(type, createEmptyFeed())
      })
    }
  }

  /**
   * Очистка всего
   */
  function cleanup() {
    // Cleanup blob URLs
    pinsCache.value.forEach((pin) => {
      cleanupPinBlobs(pin)
    })

    pinsCache.value.clear()
    feeds.value.forEach((feed) => {
      feed.pins = []
    })
  }

  // ============ HELPERS ============

  /**
   * Очистка blob URLs
   */
  function cleanupPinBlobs(pin: PinWithBlob) {
    if (pin.imageBlobUrl) {
      URL.revokeObjectURL(pin.imageBlobUrl)
    }
    if (pin.videoBlobUrl) {
      URL.revokeObjectURL(pin.videoBlobUrl)
    }
  }

  /**
   * Обновление пина в кэше
   */
  function updatePinInCache(pinId: string, updater: (pin: PinWithBlob) => PinWithBlob) {
    const cached = pinsCache.value.get(pinId)
    if (cached) {
      pinsCache.value.set(pinId, updater(cached))
    }
  }

  /**
   * Создание пустого feed
   */
  function createEmptyFeed(): PinFeed {
    return {
      pins: [],
      page: 0,
      totalPages: 0,
      totalElements: 0,
      hasMore: true,
      isLoading: false,
    }
  }

  /**
   * Получить фильтр для feed типа
   */
  function getFeedFilter(feedType: FeedType): PinFilter {
    switch (feedType) {
      case 'all':
        return { scope: 'ALL' }
      case 'created':
        return { scope: 'CREATED' }
      case 'saved':
        return { scope: 'SAVED' }
      case 'liked':
        return { scope: 'LIKED' }
      default:
        return { scope: 'ALL' }
    }
  }

  return {
    // State
    pinsCache,
    feeds,
    activeFeedType,
    currentFilter,
    pageSize,

    // Getters
    activeFeed,
    feedPins,
    isLoading,
    hasMore,
    currentPage,
    getPinById,

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
    loadMore,
    switchFeed,
    resetFeed,
    cleanup,
  }
})
