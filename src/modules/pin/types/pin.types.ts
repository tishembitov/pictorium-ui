// src/modules/pin/types/pin.types.ts

import type { PageResponse } from '@/shared/types/pageable.types';

/**
 * Pin create request
 */
export interface PinCreateRequest {
  imageId: string;           // required, minLength: 1
  thumbnailId?: string;      // maxLength: 64
  videoPreviewId?: string;   // maxLength: 64
  title?: string;            // maxLength: 200
  description?: string;      // maxLength: 400
  href?: string;             // maxLength: 200
  tags?: string[];           // unique items, each maxLength: 100
  originalWidth: number;     // required, min: 1
  originalHeight: number;    // required, min: 1
  thumbnailWidth: number;    // required, min: 1
  thumbnailHeight: number;   // required, min: 1
}

/**
 * Pin update request
 */
export interface PinUpdateRequest {
  imageId?: string;          // maxLength: 64
  thumbnailId?: string;      // maxLength: 64
  videoPreviewId?: string;   // maxLength: 64
  title?: string;            // maxLength: 200
  description?: string;      // maxLength: 400
  href?: string;             // maxLength: 200
  tags?: string[];           // unique items, each maxLength: 100
}

/**
 * Pin response from API - UPDATED согласно OpenAPI
 */
export interface PinResponse {
  id: string;
  userId: string;
  title: string | null;
  description: string | null;
  href: string | null;
  imageId: string;
  thumbnailId: string | null;
  videoPreviewId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  
  // Like status
  isLiked: boolean;
  likeCount: number;
  
  // Save status - UPDATED
  isSaved: boolean;
  savedToBoardName: string | null;   // NEW: название первой доски
  savedToBoardCount: number;          // NEW: количество досок, в которые сохранён
  saveCount: number;                  // общее количество сохранений (всеми пользователями)
  
  // Other stats
  commentCount: number;
  viewCount: number;

  // Dimensions
  originalWidth: number;
  originalHeight: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

/**
 * Paginated pins response
 */
export type PagePinResponse = PageResponse<PinResponse>;

/**
 * Pin with additional UI state
 */
export interface PinWithState extends PinResponse {
  isHovered?: boolean;
  isSelected?: boolean;
  isDeleting?: boolean;
}

/**
 * Pin form values for create/edit
 */
export interface PinFormValues {
  imageId: string;
  thumbnailId?: string;
  title: string;
  description: string;
  href: string;
  tags: string[];
}

/**
 * Pin preview for grids (minimal data)
 */
export interface PinPreview {
  id: string;
  imageId: string;
  thumbnailId: string | null;
  videoPreviewId: string | null;
}