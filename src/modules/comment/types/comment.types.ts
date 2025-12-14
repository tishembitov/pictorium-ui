// src/modules/comment/types/comment.types.ts

import type { PageResponse } from '@/shared/types/pageable.types';

/**
 * Comment create request
 */
export interface CommentCreateRequest {
  content?: string;  // maxLength: 400
  imageId?: string;
}

/**
 * Comment update request
 */
export interface CommentUpdateRequest {
  content?: string;  // maxLength: 400
  imageId?: string;
}

/**
 * Comment response from API
 */
export interface CommentResponse {
  id: string;
  pinId: string;
  userId: string;
  parentCommentId: string | null;
  content: string | null;
  imageId: string | null;
  isLiked: boolean;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

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
 * Paginated comments response
 */
export type PageCommentResponse = PageResponse<CommentResponse>;

/**
 * Paginated likes response
 */
export type PageLikeResponse = PageResponse<LikeResponse>;

/**
 * Comment with additional UI state
 */
export interface CommentWithState extends CommentResponse {
  isExpanded?: boolean;
  isEditing?: boolean;
  isReplying?: boolean;
  isDeleting?: boolean;
}

/**
 * Comment form values
 */
export interface CommentFormValues {
  content: string;
  imageId?: string;
}