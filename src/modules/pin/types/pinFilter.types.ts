// src/modules/pin/types/pinFilter.types.ts

/**
 * Pin filter scope enum (matches API)
 */
export type PinScope = 'ALL' | 'CREATED' | 'SAVED' | 'LIKED' | 'RELATED';

/**
 * Pin filter for API requests
 */
export interface PinFilter {
  q?: string;
  tags?: string[];
  authorId?: string;
  savedBy?: string;
  likedBy?: string;
  relatedTo?: string;
  createdFrom?: string;
  createdTo?: string;
  scope?: PinScope;
}

/**
 * Pin filter state for UI
 */
export interface PinFilterState extends PinFilter {
  isActive: boolean;
}

/**
 * Pin sort options
 */
export type PinSortField = 'createdAt' | 'likeCount' | 'saveCount' | 'viewCount';
export type PinSortDirection = 'asc' | 'desc';

export interface PinSortOption {
  field: PinSortField;
  direction: PinSortDirection;
  label: string;
}

/**
 * Available sort options
 */
export const PIN_SORT_OPTIONS: PinSortOption[] = [
  { field: 'createdAt', direction: 'desc', label: 'Newest' },
  { field: 'createdAt', direction: 'asc', label: 'Oldest' },
  { field: 'likeCount', direction: 'desc', label: 'Most Liked' },
  { field: 'saveCount', direction: 'desc', label: 'Most Saved' },
  { field: 'viewCount', direction: 'desc', label: 'Most Viewed' },
];