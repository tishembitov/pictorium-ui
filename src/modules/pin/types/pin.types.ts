// src/modules/pin/types/pin.types.ts

import type { PageResponse } from '@/shared/types/pageable.types';

// ==================== API Types (из OpenAPI) ====================

export interface PinCreateRequest {
  imageId: string;
  thumbnailId?: string;
  videoPreviewId?: string;
  title?: string;
  description?: string;
  href?: string;
  tags?: string[];
  originalWidth: number;
  originalHeight: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

export interface PinUpdateRequest {
  imageId?: string;
  thumbnailId?: string;
  videoPreviewId?: string;
  title?: string;
  description?: string;
  href?: string;
  tags?: string[];
}

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
  isLiked: boolean;
  likeCount: number;
  isSaved: boolean;
  isSavedToProfile: boolean;
  savedToBoardName: string | null;
  savedToBoardCount: number;
  saveCount: number;
  commentCount: number;
  viewCount: number;
  originalWidth: number;
  originalHeight: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
}

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

// ==================== Filter (точно как в API) ====================

export type PinScope = 
  | 'ALL' 
  | 'CREATED' 
  | 'SAVED'
  | 'SAVED_TO_PROFILE'
  | 'SAVED_ALL'
  | 'LIKED' 
  | 'RELATED';

/**
 * Фильтр пинов — 1:1 с API, без дублирования
 */
export interface PinFilter {
  q?: string;
  tags?: string[];
  authorId?: string;
  savedBy?: string;
  savedToProfileBy?: string;
  likedBy?: string;
  relatedTo?: string;
  createdFrom?: string;
  createdTo?: string;
  scope?: PinScope;
}

// ==================== Sort ====================

export type PinSortField = 'createdAt' | 'likeCount' | 'saveCount' | 'viewCount';
export type PinSortDirection = 'asc' | 'desc';

export interface PinSort {
  field: PinSortField;
  direction: PinSortDirection;
}

// ==================== UI Options ====================

export interface ScopeOption {
  value: PinScope;
  label: string;
  icon?: 'pin' | 'board' | 'person' | 'heart' | 'sparkle';
}

export const SCOPE_OPTIONS: ScopeOption[] = [
  { value: 'ALL', label: 'All Pins', icon: 'sparkle' },
  { value: 'CREATED', label: 'Created', icon: 'pin' },
  { value: 'SAVED_ALL', label: 'Saved', icon: 'board' },
  { value: 'LIKED', label: 'Liked', icon: 'heart' },
];

export const SORT_OPTIONS: { value: string; label: string; field: PinSortField; direction: PinSortDirection }[] = [
  { value: 'newest', label: 'Newest', field: 'createdAt', direction: 'desc' },
  { value: 'oldest', label: 'Oldest', field: 'createdAt', direction: 'asc' },
  { value: 'popular', label: 'Most Liked', field: 'likeCount', direction: 'desc' },
  { value: 'saved', label: 'Most Saved', field: 'saveCount', direction: 'desc' },
];