// src/composables/api/usePinComments.ts
import { computed, onUnmounted } from 'vue'
import { useCommentsStore } from '@/stores/comments.store'
import type { CommentWithBlob } from '@/types'

export function usePinComments(pinId: string | (() => string)) {
  const store = useCommentsStore()

  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  const comments = computed<CommentWithBlob[]>(() => store.getPinComments(getId()))

  const hasMore = computed(() => store.hasMoreComments(getId()))
  const isLoading = computed(() => store.isLoading)

  async function fetch(page = 0) {
    return await store.fetchPinComments(getId(), page)
  }

  async function loadMore() {
    return await store.loadMoreComments(getId())
  }

  async function add(content?: string, imageFile?: File) {
    return await store.createComment(getId(), content, imageFile)
  }

  function cleanup() {
    store.clearPinComments(getId())
  }

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
