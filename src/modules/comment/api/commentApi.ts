// src/modules/comment/api/commentApi.ts

import { get, post, patch, del } from '@/shared/api/apiClient';
import { COMMENT_ENDPOINTS, PIN_ENDPOINTS } from '@/shared/api/apiEndpoints';
import { createPaginationParams } from '@/shared/api/apiTypes';
import type { Pageable } from '@/shared/types/pageable.types';
import type {
  CommentResponse,
  CommentCreateRequest,
  CommentUpdateRequest,
  PageCommentResponse,
} from '../types/comment.types';

/**
 * Comment API client
 */
export const commentApi = {
  /**
   * Get comment by ID
   */
  getById: (commentId: string) => {
    return get<CommentResponse>(COMMENT_ENDPOINTS.byId(commentId));
  },

  /**
   * Update comment
   */
  update: (commentId: string, data: CommentUpdateRequest) => {
    return patch<CommentResponse, CommentUpdateRequest>(
      COMMENT_ENDPOINTS.update(commentId),
      data
    );
  },

  /**
   * Delete comment
   */
  delete: (commentId: string) => {
    return del<void>(COMMENT_ENDPOINTS.delete(commentId));
  },

  /**
   * Get comments for a pin
   */
  getByPin: (pinId: string, pageable: Pageable = {}) => {
    return get<PageCommentResponse>(PIN_ENDPOINTS.comments(pinId), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Create comment on a pin
   */
  createOnPin: (pinId: string, data: CommentCreateRequest) => {
    return post<CommentResponse, CommentCreateRequest>(
      PIN_ENDPOINTS.createComment(pinId),
      data
    );
  },

  /**
   * Get replies to a comment
   */
  getReplies: (commentId: string, pageable: Pageable = {}) => {
    return get<PageCommentResponse>(COMMENT_ENDPOINTS.replies(commentId), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Create reply to a comment
   */
  createReply: (commentId: string, data: CommentCreateRequest) => {
    return post<CommentResponse, CommentCreateRequest>(
      COMMENT_ENDPOINTS.createReply(commentId),
      data
    );
  },
};

export default commentApi;