// src/modules/pin/api/pinCommentApi.ts

import { get, post } from '@/shared/api/apiClient';
import { PIN_ENDPOINTS } from '@/shared/api/apiEndpoints';
import { createPaginationParams } from '@/shared/api/apiTypes';
import type { Pageable } from '@/shared/types/pageable.types';
import type { 
  CommentResponse, 
  CommentCreateRequest, 
  PageCommentResponse 
} from '@/modules/comment';

/**
 * Pin Comment API client
 */
export const pinCommentApi = {
  /**
   * Get comments for a pin
   */
  getComments: (pinId: string, pageable: Pageable = {}) => {
    return get<PageCommentResponse>(PIN_ENDPOINTS.comments(pinId), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Create comment on a pin
   */
  createComment: (pinId: string, data: CommentCreateRequest) => {
    return post<CommentResponse, CommentCreateRequest>(
      PIN_ENDPOINTS.createComment(pinId),
      data
    );
  },
};

export default pinCommentApi;