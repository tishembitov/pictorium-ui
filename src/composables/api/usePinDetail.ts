// src/composables/api/usePinDetail.ts
/**
 * usePinDetail - Composable для страницы детального просмотра пина
 *
 * Комбинирует данные из pins.store и comments.store
 * Предоставляет реактивные данные для конкретного пина
 */

import { computed, onUnmounted, ref } from 'vue'
import { usePinsStore } from '@/stores/pins.store'
import { useCommentsStore } from '@/stores/comments.store'
import type { PinWithBlob, CommentWithBlob } from '@/types'

export interface UsePinDetailOptions {
  /** Загружать комментарии автоматически */
  loadComments?: boolean
  /** Загружать related pins автоматически */
  loadRelated?: boolean
  /** Количество related pins для загрузки */
  relatedPinsSize?: number
}

export function usePinDetail(pinId: string | (() => string), options: UsePinDetailOptions = {}) {
  const { loadComments = true, loadRelated = true, relatedPinsSize = 15 } = options

  const pinsStore = usePinsStore()
  const commentsStore = useCommentsStore()

  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  // ============ ERROR STATE ============
  const error = ref<Error | null>(null)

  // ============ REACTIVE DATA ============

  /** Текущий пин */
  const pin = computed<PinWithBlob | null>(() => pinsStore.getPinById(getId()) || null)

  /** Комментарии пина */
  const comments = computed<CommentWithBlob[]>(() => commentsStore.getPinComments(getId()))

  /** ✅ Related pins - теперь работает! */
  const relatedPins = computed<PinWithBlob[]>(() => pinsStore.getRelatedPins(getId()))

  /** Есть ли ещё комментарии */
  const hasMoreComments = computed(() => commentsStore.hasMoreComments(getId()))

  /** ✅ Есть ли ещё related pins */
  const hasMoreRelatedPins = computed(() => pinsStore.hasMoreRelatedPins(getId()))

  /** ✅ Pagination info для related pins */
  const relatedPinsPagination = computed(() => pinsStore.getRelatedPinsPagination(getId()))

  // ============ LOADING STATES ============

  const isLoading = computed(() => pinsStore.isLoading)
  const isLoadingComments = computed(() => commentsStore.isLoading)
  const isLoadingRelated = computed(() => pinsStore.isLoadingRelated)

  // ============ ACTIONS ============

  /** Загрузить пин */
  async function fetchPin(forceReload = false) {
    try {
      error.value = null
      return await pinsStore.fetchPinById(getId(), forceReload)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  /** Загрузить комментарии */
  async function fetchComments(page = 0) {
    try {
      return await commentsStore.fetchPinComments(getId(), page)
    } catch (e) {
      console.error('[usePinDetail] Failed to fetch comments:', e)
      throw e
    }
  }

  /** Загрузить больше комментариев */
  async function loadMoreComments() {
    return await commentsStore.loadMoreComments(getId())
  }

  /** ✅ Загрузить related pins */
  async function fetchRelatedPins(page = 0) {
    try {
      return await pinsStore.fetchRelatedPins(getId(), page, relatedPinsSize)
    } catch (e) {
      console.error('[usePinDetail] Failed to fetch related pins:', e)
      throw e
    }
  }

  /** ✅ Загрузить больше related pins */
  async function loadMoreRelatedPins() {
    return await pinsStore.loadMoreRelatedPins(getId())
  }

  /** Загрузить всё */
  async function fetchAll(forceReload = false) {
    const promises: Promise<unknown>[] = [fetchPin(forceReload)]

    if (loadComments) {
      promises.push(fetchComments(0))
    }

    if (loadRelated) {
      promises.push(fetchRelatedPins(0))
    }

    await Promise.all(promises)
  }

  // ============ PIN ACTIONS ============

  async function like() {
    return await pinsStore.likePin(getId())
  }

  async function unlike() {
    return await pinsStore.unlikePin(getId())
  }

  async function save() {
    return await pinsStore.savePin(getId())
  }

  async function unsave() {
    return await pinsStore.unsavePin(getId())
  }

  async function deletePin() {
    return await pinsStore.deletePin(getId())
  }

  // ============ COMMENT ACTIONS ============

  async function addComment(content?: string, imageFile?: File) {
    return await commentsStore.createComment(getId(), content, imageFile)
  }

  // ============ CLEANUP ============

  function cleanup() {
    commentsStore.clearPinComments(getId())
    pinsStore.clearRelatedPins(getId())
  }

  onUnmounted(cleanup)

  return {
    // Data
    pin,
    comments,
    relatedPins,
    hasMoreComments,
    hasMoreRelatedPins,
    relatedPinsPagination,

    // Error
    error,

    // Loading
    isLoading,
    isLoadingComments,
    isLoadingRelated,

    // Actions
    fetchPin,
    fetchComments,
    loadMoreComments,
    fetchRelatedPins,
    loadMoreRelatedPins,
    fetchAll,

    // Pin actions
    like,
    unlike,
    save,
    unsave,
    deletePin,

    // Comment actions
    addComment,

    // Cleanup
    cleanup,
  }
}
