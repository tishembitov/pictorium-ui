// src/stores/pins.store.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Pin, PinFeed, PinWithBlob, PinFilter, PagePin } from '@/types'
import { pinsApi, savedPinsApi, likesApi, storageApi } from '@/api'
import { isVideo, getImageDimensions } from '@/utils/media'

type FeedType = 'all' | 'created' | 'saved' | 'liked'

export const usePinsStore = defineStore('pins', () => {
  // ============ STATE ============

  const pinsCache = reactive(new Map<string, PinWithBlob>())

  const feeds = reactive(
    new Map<FeedType, PinFeed>([
      ['all', createEmptyFeed()],
      ['created', createEmptyFeed()],
      ['saved', createEmptyFeed()],
      ['liked', createEmptyFeed()],
    ]),
  )

  const activeFeedType = ref<FeedType>('all')
  const currentFilter = ref<PinFilter>({ scope: 'ALL' })
  const pageSize = ref(15)

  // ============ GETTERS ============

  const activeFeed = computed(() => feeds.get(activeFeedType.value)!)
  const feedPins = computed(() => activeFeed.value.pins)
  const isLoading = computed(() => activeFeed.value.isLoading)
  const hasMore = computed(() => activeFeed.value.hasMore)
  const currentPage = computed(() => activeFeed.value.page)

  const getPinById = computed(() => (pinId: string) => {
    return pinsCache.get(pinId)
  })

  // ============ BLOB LOADING ============

  async function loadPinBlob(pin: Pin): Promise<PinWithBlob> {
    if (!pin.imageUrl && !pin.videoPreviewUrl) return pin

    try {
      const pinWithBlob: PinWithBlob = { ...pin }

      const isVideoFile = pin.videoPreviewUrl ? true : pin.imageUrl ? isVideo(pin.imageUrl) : false
      const isGifFile = pin.imageUrl?.toLowerCase().endsWith('.gif')

      pinWithBlob.isVideo = isVideoFile
      pinWithBlob.isGif = isGifFile
      pinWithBlob.isImage = !isVideoFile && !isGifFile

      const promises: Promise<void>[] = []

      if (pin.imageUrl && !isVideoFile) {
        promises.push(
          storageApi.downloadImage(pin.imageUrl).then((blob) => {
            pinWithBlob.imageBlobUrl = URL.createObjectURL(blob)
          }),
        )
      }

      if (pin.videoPreviewUrl) {
        promises.push(
          storageApi.downloadImage(pin.videoPreviewUrl).then((blob) => {
            pinWithBlob.videoBlobUrl = URL.createObjectURL(blob)
          }),
        )
      }

      await Promise.allSettled(promises)
      return pinWithBlob
    } catch (error) {
      console.error('[Pins] Failed to load pin blob:', error)
      return pin
    }
  }

  async function loadPinsBlobs(pins: Pin[]): Promise<PinWithBlob[]> {
    return Promise.all(pins.map(loadPinBlob))
  }

  // ============ ACTIONS ============

  async function fetchPins(filter?: PinFilter, page = 0, size = 15, feedType: FeedType = 'all') {
    const feed = feeds.get(feedType)!

    if (feed.isLoading) {
      console.warn('[Pins] Feed is already loading')
      return []
    }

    try {
      feed.isLoading = true

      if (filter) currentFilter.value = filter

      const response: PagePin = await pinsApi.getPins(currentFilter.value, {
        page,
        size,
        sort: ['createdAt,desc'],
      })

      const pinsWithBlobs = await loadPinsBlobs(response.content)

      pinsWithBlobs.forEach((pin) => {
        pinsCache.set(pin.id, pin)
      })

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
      feed.isLoading = false
    }
  }

  async function fetchPinById(pinId: string, forceReload = false) {
    try {
      if (!forceReload && pinsCache.has(pinId)) {
        return pinsCache.get(pinId)!
      }

      const pin = await pinsApi.getById(pinId)
      const pinWithBlob = await loadPinBlob(pin)

      pinsCache.set(pinId, pinWithBlob)
      return pinWithBlob
    } catch (error) {
      console.error('[Pins] Failed to fetch pin:', error)
      throw error
    }
  }

  async function createPin(data: {
    file: File
    title?: string
    description?: string
    href?: string
    tags?: string[]
    rgb?: string
  }) {
    try {
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

      const uploadResponse = await storageApi.uploadImage({
        file: data.file,
        category: 'pins',
        generateThumbnail: true,
        thumbnailWidth: 400,
        thumbnailHeight: 400,
      })

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

      const pinWithBlob = await loadPinBlob(pin)
      pinsCache.set(pin.id, pinWithBlob)

      const createdFeed = feeds.get('created')!
      createdFeed.pins.unshift(pinWithBlob)
      createdFeed.totalElements++

      const allFeed = feeds.get('all')!
      allFeed.pins.unshift(pinWithBlob)
      allFeed.totalElements++

      return pinWithBlob
    } catch (error) {
      console.error('[Pins] Failed to create pin:', error)
      throw error
    }
  }

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

      const cached = pinsCache.get(pinId)
      if (cached) {
        pinsCache.set(pinId, {
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

  async function deletePin(pinId: string) {
    try {
      await pinsApi.delete(pinId)

      const cached = pinsCache.get(pinId)
      if (cached) {
        cleanupPinBlobs(cached)
        pinsCache.delete(pinId)
      }

      feeds.forEach((feed) => {
        const index = feed.pins.findIndex((p) => p.id === pinId)
        if (index !== -1) {
          feed.pins.splice(index, 1)
          feed.totalElements = Math.max(0, feed.totalElements - 1)
        }
      })
    } catch (error) {
      console.error('[Pins] Failed to delete pin:', error)
      throw error
    }
  }

  async function likePin(pinId: string) {
    try {
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isLiked: true,
        likeCount: pin.likeCount + 1,
      }))

      await likesApi.likePin(pinId)
    } catch (error) {
      console.error('[Pins] Failed to like pin:', error)
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isLiked: false,
        likeCount: Math.max(0, pin.likeCount - 1),
      }))
      throw error
    }
  }

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

  async function savePin(pinId: string) {
    try {
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isSaved: true,
        saveCount: pin.saveCount + 1,
      }))

      await savedPinsApi.save(pinId)

      const pin = pinsCache.get(pinId)
      if (pin) {
        const savedFeed = feeds.get('saved')!
        savedFeed.pins.unshift(pin)
        savedFeed.totalElements++
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

  async function unsavePin(pinId: string) {
    try {
      updatePinInCache(pinId, (pin) => ({
        ...pin,
        isSaved: false,
        saveCount: Math.max(0, pin.saveCount - 1),
      }))

      await savedPinsApi.unsave(pinId)

      const savedFeed = feeds.get('saved')!
      const index = savedFeed.pins.findIndex((p) => p.id === pinId)
      if (index !== -1) {
        savedFeed.pins.splice(index, 1)
        savedFeed.totalElements = Math.max(0, savedFeed.totalElements - 1)
      }
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

  async function loadMore() {
    const feed = activeFeed.value
    if (!feed.hasMore || feed.isLoading) return

    await fetchPins(currentFilter.value, feed.page + 1, pageSize.value, activeFeedType.value)
  }

  async function switchFeed(feedType: FeedType, filter?: PinFilter) {
    const feed = feeds.get(feedType)!

    if (feed.isLoading) {
      console.warn('[Pins] Feed is already loading')
      return
    }

    activeFeedType.value = feedType

    if (feed.pins.length === 0) {
      const feedFilter = filter || getFeedFilter(feedType)
      await fetchPins(feedFilter, 0, pageSize.value, feedType)
    }
  }

  function resetFeed(feedType?: FeedType) {
    if (feedType) {
      feeds.set(feedType, createEmptyFeed())
    } else {
      feeds.forEach((feed, type) => {
        feeds.set(type, createEmptyFeed())
      })
    }
  }

  function clearPin(pinId: string) {
    const cached = pinsCache.get(pinId)
    if (cached) {
      cleanupPinBlobs(cached)
      pinsCache.delete(pinId)
    }
  }

  function cleanup() {
    pinsCache.forEach((pin) => {
      cleanupPinBlobs(pin)
    })

    pinsCache.clear()
    feeds.forEach((feed) => {
      feed.pins = []
    })
  }

  // ============ HELPERS ============

  function cleanupPinBlobs(pin: PinWithBlob) {
    if (pin.imageBlobUrl) {
      URL.revokeObjectURL(pin.imageBlobUrl)
    }
    if (pin.videoBlobUrl) {
      URL.revokeObjectURL(pin.videoBlobUrl)
    }
  }

  function updatePinInCache(pinId: string, updater: (pin: PinWithBlob) => PinWithBlob) {
    const cached = pinsCache.get(pinId)
    if (cached) {
      pinsCache.set(pinId, updater(cached))
    }
  }

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
    pinsCache,
    feeds,
    activeFeedType,
    currentFilter,
    pageSize,
    activeFeed,
    feedPins,
    isLoading,
    hasMore,
    currentPage,
    getPinById,
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
    clearPin,
    cleanup,
  }
})
