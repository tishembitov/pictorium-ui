/**
 * useComments Composable (Refactored)
 */

import { computed } from 'vue'
import { commentsApi } from '@/api/comments.api'
import { useLoadMore } from '@/composables/core/useLoadMore'
import { useApiCall } from '@/composables/core/useApiCall'
import type { Comment, CommentCreateRequest, CommentUpdateRequest } from '@/types'

/**
 * useComments - Список комментариев пина с пагинацией
 */
export function useComments(pinId: string | (() => string)) {
  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  const {
    items: comments,
    isLoading,
    isLoadingMore,
    hasMore,
    load,
    loadMore,
    reset,
  } = useLoadMore({
    fetchFn: (page, size) =>
      commentsApi.getComments(getId(), {
        pageable: { page, size, sort: ['createdAt,desc'] },
        pinId: getId(),
      }),
    pageSize: 10,
  })

  // Create Comment
  const { execute: createComment } = useApiCall(
    async (data: CommentCreateRequest) => {
      const comment = await commentsApi.createComment(getId(), data)
      comments.value.unshift(comment) // Добавляем в начало
      return comment
    },
    { showSuccessToast: true, successMessage: 'Comment added!', showErrorToast: true },
  )

  // Update Comment
  const { execute: updateComment } = useApiCall(
    async (commentId: string, data: CommentUpdateRequest) => {
      const updated = await commentsApi.update(commentId, data)

      const index = comments.value.findIndex((c) => c.id === commentId)
      if (index !== -1) {
        comments.value[index] = updated
      }

      return updated
    },
    { showSuccessToast: true, successMessage: 'Comment updated!', showErrorToast: true },
  )

  // Delete Comment
  const { execute: deleteComment } = useApiCall(
    async (commentId: string) => {
      await commentsApi.delete(commentId)
      comments.value = comments.value.filter((c) => c.id !== commentId)
    },
    { showSuccessToast: true, successMessage: 'Comment deleted!', showErrorToast: true },
  )

  return {
    comments,
    isLoading,
    isLoadingMore,
    hasMore,
    load,
    loadMore,
    reset,
    createComment: async (data: CommentCreateRequest) => (await createComment(data))!,
    updateComment: async (commentId: string, data: CommentUpdateRequest) =>
      (await updateComment(commentId, data))!,
    deleteComment: async (commentId: string) => {
      await deleteComment(commentId)
    },
  }
}

/**
 * useCommentReplies - Ответы на комментарий
 */
export function useCommentReplies(commentId: string | (() => string)) {
  const getId = () => (typeof commentId === 'string' ? commentId : commentId())

  const {
    items: replies,
    isLoading,
    hasMore,
    load,
    loadMore,
  } = useLoadMore({
    fetchFn: (page, size) =>
      commentsApi.getReplies(getId(), {
        pageable: { page, size, sort: ['createdAt,asc'] },
        commentId: getId(),
      }),
    pageSize: 5,
  })

  // Create Reply
  const { execute: createReply } = useApiCall(
    async (data: CommentCreateRequest) => {
      const reply = await commentsApi.createReply(getId(), data)
      replies.value.push(reply) // Добавляем в конец
      return reply
    },
    { showSuccessToast: true, successMessage: 'Reply added!', showErrorToast: true },
  )

  return {
    replies,
    isLoading,
    hasMore,
    load,
    loadMore,
    createReply: async (data: CommentCreateRequest) => (await createReply(data))!,
  }
}
