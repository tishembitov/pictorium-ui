/**
 * Comments API
 */

import { contentServiceClient } from './client'
import type {
  CommentCreateRequest,
  CreateCommentResponse,
  GetCommentsParams,
  GetCommentsResponse,
  GetCommentResponse,
  CommentUpdateRequest,
  UpdateCommentResponse,
  GetRepliesParams,
  GetRepliesResponse,
  CreateReplyResponse,
} from '@/types'
import { serializePageableAsJson } from '@/utils/query'

const PINS_BASE_PATH = '/api/v1/pins'
const COMMENTS_BASE_PATH = '/api/v1/comments'

export const commentsApi = {
  /**
   * Получить комментарии пина
   */
  getComments: async (pinId: string, params: GetCommentsParams): Promise<GetCommentsResponse> => {
    const { data } = await contentServiceClient.get(`${PINS_BASE_PATH}/${pinId}/comments`, {
      params: {
        pageable: serializePageableAsJson(params.pageable),
      },
    })
    return data
  },

  /**
   * Создать комментарий к пину
   */
  createComment: async (
    pinId: string,
    commentData: CommentCreateRequest,
  ): Promise<CreateCommentResponse> => {
    const { data } = await contentServiceClient.post(
      `${PINS_BASE_PATH}/${pinId}/comments`,
      commentData,
    )
    return data
  },

  /**
   * Получить комментарий по ID
   */
  getById: async (commentId: string): Promise<GetCommentResponse> => {
    const { data } = await contentServiceClient.get(`${COMMENTS_BASE_PATH}/${commentId}`)
    return data
  },

  /**
   * Обновить комментарий
   */
  update: async (
    commentId: string,
    commentData: CommentUpdateRequest,
  ): Promise<UpdateCommentResponse> => {
    const { data } = await contentServiceClient.patch(
      `${COMMENTS_BASE_PATH}/${commentId}`,
      commentData,
    )
    return data
  },

  /**
   * Удалить комментарий
   */
  delete: async (commentId: string): Promise<void> => {
    await contentServiceClient.delete(`${COMMENTS_BASE_PATH}/${commentId}`)
  },

  /**
   * Получить ответы на комментарий
   */
  getReplies: async (commentId: string, params: GetRepliesParams): Promise<GetRepliesResponse> => {
    const { data } = await contentServiceClient.get(`${COMMENTS_BASE_PATH}/${commentId}/replies`, {
      params: {
        pageable: serializePageableAsJson(params.pageable),
      },
    })
    return data
  },

  /**
   * Создать ответ на комментарий
   */
  createReply: async (
    commentId: string,
    replyData: CommentCreateRequest,
  ): Promise<CreateReplyResponse> => {
    const { data } = await contentServiceClient.post(
      `${COMMENTS_BASE_PATH}/${commentId}/replies`,
      replyData,
    )
    return data
  },
}
