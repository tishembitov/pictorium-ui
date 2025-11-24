/**
 * useLikes Composable (Refactored)
 */

import { computed } from 'vue'
import { likesApi } from '@/api/likes.api'
import { useLoadMore } from '@/composables/core/useLoadMore'
import { useApiCall } from '@/composables/core/useApiCall'
import type { User } from '@/types'

/**
 * useLikes - Базовые действия с лайками
 */
export function useLikes() {
  // Pin Likes
  const { execute: likePinAction } = useApiCall((pinId: string) => likesApi.likePin(pinId), {
    showErrorToast: true,
    errorMessage: 'Failed to like pin',
  })

  const { execute: unlikePinAction } = useApiCall((pinId: string) => likesApi.unlikePin(pinId), {
    showErrorToast: true,
    errorMessage: 'Failed to unlike pin',
  })

  // Comment Likes
  const { execute: likeCommentAction } = useApiCall(
    (commentId: string) => likesApi.likeComment(commentId),
    { showErrorToast: true, errorMessage: 'Failed to like comment' },
  )

  const { execute: unlikeCommentAction } = useApiCall(
    (commentId: string) => likesApi.unlikeComment(commentId),
    { showErrorToast: true, errorMessage: 'Failed to unlike comment' },
  )

  return {
    likePinAction: async (pinId: string) => {
      await likePinAction(pinId)
    },
    unlikePinAction: async (pinId: string) => {
      await unlikePinAction(pinId)
    },
    likeCommentAction: async (commentId: string) => {
      await likeCommentAction(commentId)
    },
    unlikeCommentAction: async (commentId: string) => {
      await unlikeCommentAction(commentId)
    },
  }
}

/**
 * usePinLikes - Список лайков пина с пагинацией
 */
export function usePinLikes(pinId: string | (() => string)) {
  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  const {
    items: likes,
    isLoading,
    hasMore,
    load,
    loadMore,
  } = useLoadMore<User>({
    fetchFn: async (page, size) => {
      const response = await likesApi.getPinLikes(getId(), {
        pageable: { page, size, sort: ['createdAt,desc'] },
        pinId: getId(),
      })

      // Преобразуем Like[] в User[]
      return {
        ...response,
        content: response.content.map((like) => ({ id: like.userId }) as User),
      }
    },
    pageSize: 20,
  })

  return {
    likes,
    isLoading,
    hasMore,
    load,
    loadMore,
  }
}

/**
 * useCommentLikes - Список лайков комментария
 */
export function useCommentLikes(commentId: string | (() => string)) {
  const getId = () => (typeof commentId === 'string' ? commentId : commentId())

  const {
    items: likes,
    isLoading,
    load,
  } = useLoadMore<User>({
    fetchFn: async (page, size) => {
      const response = await likesApi.getCommentLikes(getId(), {
        pageable: { page, size, sort: ['createdAt,desc'] },
        commentId: getId(),
      })

      return {
        ...response,
        content: response.content.map((like) => ({ id: like.userId }) as User),
      }
    },
    pageSize: 10,
  })

  return {
    likes,
    isLoading,
    load,
  }
}
