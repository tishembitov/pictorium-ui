// src/modules/pin/types/pinLike.types.ts

import type { PageResponse } from '@/shared/types/pageable.types';

/**
 * Like response from API
 */
export interface LikeResponse {
  id: string;
  userId: string;
  pinId: string | null;
  commentId: string | null;
  createdAt: string;
}

/**
 * Paginated likes response
 */
export type PageLikeResponse = PageResponse<LikeResponse>;

/**
 * Like action result
 */
export interface LikeActionResult {
  success: boolean;
  isLiked: boolean;
  likeCount: number;
}