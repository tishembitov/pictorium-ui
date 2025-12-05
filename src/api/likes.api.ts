/**
 * Likes API
 */

import { contentServiceClient } from './client'
import type {
  LikePinResponse,
  GetPinLikesParams,
  GetPinLikesResponse,
  LikeCommentResponse,
  GetCommentLikesParams,
  GetCommentLikesResponse,
} from '@/types'

const PINS_BASE_PATH = '/api/v1/pins'
const COMMENTS_BASE_PATH = '/api/v1/comments'

export const likesApi = {
  // ============================================================================
  // PIN LIKES
  // ============================================================================

  /**
   * Лайкнуть пин
   */
  likePin: async (pinId: string): Promise<LikePinResponse> => {
    const { data } = await contentServiceClient.post(`${PINS_BASE_PATH}/${pinId}/likes`)
    return data
  },

  /**
   * Убрать лайк с пина
   */
  unlikePin: async (pinId: string): Promise<void> => {
    await contentServiceClient.delete(`${PINS_BASE_PATH}/${pinId}/likes`)
  },

  /**
   * Получить лайки пина
   */
  getPinLikes: async (pinId: string, params: GetPinLikesParams): Promise<GetPinLikesResponse> => {
    const { data } = await contentServiceClient.get(`${PINS_BASE_PATH}/${pinId}/likes`, {
      params: {
        pageable: JSON.stringify(params.pageable),
      },
    })
    return data
  },

  // ============================================================================
  // COMMENT LIKES
  // ============================================================================

  /**
   * Лайкнуть комментарий
   */
  likeComment: async (commentId: string): Promise<LikeCommentResponse> => {
    const { data } = await contentServiceClient.post(`${COMMENTS_BASE_PATH}/${commentId}/likes`)
    return data
  },

  /**
   * Убрать лайк с комментария
   */
  unlikeComment: async (commentId: string): Promise<void> => {
    await contentServiceClient.delete(`${COMMENTS_BASE_PATH}/${commentId}/likes`)
  },

  /**
   * Получить лайки комментария
   */
  getCommentLikes: async (
    commentId: string,
    params: GetCommentLikesParams,
  ): Promise<GetCommentLikesResponse> => {
    const { data } = await contentServiceClient.get(`${COMMENTS_BASE_PATH}/${commentId}/likes`, {
      params: {
        pageable: JSON.stringify(params.pageable),
      },
    })
    return data
  },
}
