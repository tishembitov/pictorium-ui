// src/modules/comment/api/commentLikeApi.ts

import { get, post, del } from '@/shared/api/apiClient';
import { COMMENT_ENDPOINTS } from '@/shared/api/apiEndpoints';
import { createPaginationParams } from '@/shared/api/apiTypes';
import type { Pageable } from '@/shared/types/pageable.types';
import type { CommentResponse, PageLikeResponse } from '../types/comment.types';

/**
 * Comment Like API client
 */
export const commentLikeApi = {
  /**
   * Get likes for a comment
   */
  getLikes: (commentId: string, pageable: Pageable = {}) => {
    return get<PageLikeResponse>(COMMENT_ENDPOINTS.likes(commentId), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Like a comment
   * @returns Updated CommentResponse
   */
  like: (commentId: string) => {
    return post<CommentResponse>(COMMENT_ENDPOINTS.like(commentId));
  },

  /**
   * Unlike a comment
   * @returns Updated CommentResponse
   */
  unlike: (commentId: string) => {
    return del<CommentResponse>(COMMENT_ENDPOINTS.unlike(commentId));
  },
};

export default commentLikeApi;