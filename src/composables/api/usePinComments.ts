// src/composables/api/usePinComments.ts
/**
 * usePinComments - Комментарии пина
 * ✅ ИСПРАВЛЕНО: поддержка getter для pinId
 */

import { computed, onUnmounted } from 'vue'
import { useCommentsStore } from '@/stores/comments.store'
import type { CommentWithBlob } from '@/types'

export function usePinComments(pinId: string | (() => string)) {
  const store = useCommentsStore()

  // ✅ Поддержка getter
  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  const comments = computed<CommentWithBlob[]>(() => store.getPinComments(getId()))
  const hasMore = computed(() => store.hasMoreComments(getId()))
  const isLoading = computed(() => store.isLoading)

  const fetch = (page = 0, reset = false) => store.fetchPinComments(getId(), page, 20, reset)

  const loadMore = () => store.loadMoreComments(getId())

  const add = (content?: string, imageFile?: File) =>
    store.createComment(getId(), content, imageFile)

  const cleanup = () => store.clearPinComments(getId())

  onUnmounted(cleanup)

  return {
    comments,
    hasMore,
    isLoading,
    fetch,
    loadMore,
    add,
    cleanup,
  }
}
