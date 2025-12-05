// src/composables/api/useCommentLikes.ts
/**
 * useCommentLikes - Загрузка пользователей, лайкнувших комментарий
 */

import { likesApi } from '@/api'
import { useLikesBase, type LikeUser, type UseLikesBaseOptions } from './useLikesBase'

export interface CommentLikeUser extends LikeUser {
  likedAt?: string
}

export interface UseCommentLikesOptions extends UseLikesBaseOptions {}

export function useCommentLikes(
  commentId: string | (() => string),
  options: UseCommentLikesOptions = {},
) {
  const { pageSize = 5, ...restOptions } = options
  const getId = () => (typeof commentId === 'string' ? commentId : commentId())

  return useLikesBase<CommentLikeUser>(
    getId,
    {
      fetchLikes: async (id, pageable) => {
        const response = await likesApi.getCommentLikes(id, {
          commentId: id,
        pageable,
      })
  return {
          content: response.content,
          number: response.number,
          totalElements: response.totalElements,
          last: response.last,
  }
      },
    },
    { ...restOptions, pageSize },
  )
}
