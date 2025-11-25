// src/composables/api/useCommentThread.ts
/**
 * useCommentThread - Composable для ветки комментариев (с replies)
 */

import { computed } from 'vue'
import { useCommentsStore } from '@/stores/comments.store'
import type { CommentWithBlob } from '@/types'

export function useCommentThread(commentId: string | (() => string)) {
  const commentsStore = useCommentsStore()

  const getId = () => (typeof commentId === 'string' ? commentId : commentId())

  // ============ REACTIVE DATA ============

  const comment = computed<CommentWithBlob | null>(() => commentsStore.getCommentById(getId()))

  const replies = computed<CommentWithBlob[]>(() => commentsStore.getCommentReplies(getId()))

  const hasMoreReplies = computed(() => commentsStore.hasMoreReplies(getId()))

  const isLoadingReplies = computed(() => commentsStore.isLoadingReplies.get(getId()) || false)

  // ============ ACTIONS ============

  async function fetchReplies(page = 0) {
    return await commentsStore.fetchReplies(getId(), page)
  }

  async function loadMoreReplies() {
    const pagination = commentsStore.repliesPaginationCache.get(getId())
    if (!pagination?.hasMore) return []
    return await commentsStore.fetchReplies(getId(), pagination.page + 1)
  }

  async function addReply(content?: string, imageFile?: File) {
    return await commentsStore.createReply(getId(), content, imageFile)
  }

  async function like() {
    return await commentsStore.likeComment(getId())
  }

  async function unlike() {
    return await commentsStore.unlikeComment(getId())
  }

  async function deleteComment() {
    const comment = commentsStore.getCommentById(getId())
    if (comment) {
      return await commentsStore.deleteComment(getId(), comment.pinId)
    }
  }

  return {
    comment,
    replies,
    hasMoreReplies,
    isLoadingReplies,
    fetchReplies,
    loadMoreReplies,
    addReply,
    like,
    unlike,
    deleteComment,
  }
}
