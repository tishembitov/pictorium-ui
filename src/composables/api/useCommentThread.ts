// src/composables/api/useCommentThread.ts
/**
 * useCommentThread - Composable для ветки комментариев (с replies)
 */

import { computed, ref } from 'vue'
import { useCommentsStore } from '@/stores/comments.store'
import type { CommentWithBlob } from '@/types'

export function useCommentThread(commentId: string | (() => string)) {
  const commentsStore = useCommentsStore()

  const getId = () => (typeof commentId === 'string' ? commentId : commentId())

  // ============ ERROR STATE ============
  const error = ref<Error | null>(null)

  // ============ REACTIVE DATA ============

  const comment = computed<CommentWithBlob | null>(() => commentsStore.getCommentById(getId()))

  const replies = computed<CommentWithBlob[]>(() => commentsStore.getCommentReplies(getId()))

  const hasMoreReplies = computed(() => commentsStore.hasMoreReplies(getId()))

  const isLoadingReplies = computed(() => commentsStore.isLoadingReplies.get(getId()) || false)

  const pagination = computed(() => commentsStore.getRepliesPagination(getId()))

  // ============ ACTIONS ============

  async function fetchReplies(page = 0) {
    try {
      error.value = null
      return await commentsStore.fetchReplies(getId(), page)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function loadMoreReplies() {
    if (!hasMoreReplies.value || isLoadingReplies.value) {
      return []
    }

    try {
      error.value = null
      return await commentsStore.loadMoreReplies(getId())
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function addReply(content?: string, imageFile?: File) {
    try {
      error.value = null
      return await commentsStore.createReply(getId(), content, imageFile)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function like() {
    try {
      error.value = null
      return await commentsStore.likeComment(getId())
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function unlike() {
    try {
      error.value = null
      return await commentsStore.unlikeComment(getId())
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  async function deleteComment(): Promise<void> {
    const commentData = commentsStore.getCommentById(getId())

    if (!commentData) {
      const err = new Error(`Comment ${getId()} not found`)
      error.value = err
      throw err
    }

    try {
      error.value = null
      await commentsStore.deleteComment(getId(), commentData.pinId)
    } catch (e) {
      error.value = e as Error
      throw e
    }
  }

  return {
    // Data
    comment,
    replies,
    hasMoreReplies,
    isLoadingReplies,
    pagination,

    // Error
    error,

    // Actions
    fetchReplies,
    loadMoreReplies,
    addReply,
    like,
    unlike,
    deleteComment,
  }
}
