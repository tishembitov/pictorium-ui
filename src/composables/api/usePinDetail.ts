// src/composables/api/usePinDetail.ts
/**
 * usePinDetail - Composable для страницы детального просмотра пина
 *
 * Комбинирует данные из pins.store и comments.store
 * Предоставляет реактивные данные для конкретного пина
 */

import { computed, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePinsStore } from '@/stores/pins.store'
import { useCommentsStore } from '@/stores/comments.store'
import type { PinWithBlob, CommentWithBlob } from '@/types'

export interface UsePinDetailOptions {
  /** Загружать комментарии автоматически */
  loadComments?: boolean
  /** Загружать related pins автоматически */
  loadRelated?: boolean
}

export function usePinDetail(pinId: string | (() => string), options: UsePinDetailOptions = {}) {
  const { loadComments = true, loadRelated = true } = options

  const pinsStore = usePinsStore()
  const commentsStore = useCommentsStore()

  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  // ============ REACTIVE DATA ============

  /** Текущий пин */
  const pin = computed<PinWithBlob | null>(() => pinsStore.getPinById(getId()) || null)

  /** Комментарии пина */
  const comments = computed<CommentWithBlob[]>(() => commentsStore.getPinComments(getId()))

  /** Related pins */
  const relatedPins = computed<PinWithBlob[]>(() => pinsStore.relatedPinsCache.get(getId()) || [])

  /** Есть ли ещё комментарии */
  const hasMoreComments = computed(() => commentsStore.hasMoreComments(getId()))

  // ============ LOADING STATES ============

  const isLoading = computed(() => pinsStore.isLoading)
  const isLoadingComments = computed(() => commentsStore.isLoading)

  // ============ ACTIONS ============

  /** Загрузить пин */
  async function fetchPin(forceReload = false) {
    return await pinsStore.fetchPinById(getId(), forceReload)
  }

  /** Загрузить комментарии */
  async function fetchComments(page = 0) {
    return await commentsStore.fetchPinComments(getId(), page)
  }

  /** Загрузить больше комментариев */
  async function loadMoreComments() {
    return await commentsStore.loadMoreComments(getId())
  }

  /** Загрузить related pins */
  async function fetchRelatedPins(page = 0) {
    return await pinsStore.fetchRelatedPins(getId(), page)
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
  }

  onUnmounted(cleanup)

  return {
    // Data
    pin,
    comments,
    relatedPins,
    hasMoreComments,

    // Loading
    isLoading,
    isLoadingComments,

    // Actions
    fetchPin,
    fetchComments,
    loadMoreComments,
    fetchRelatedPins,
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
