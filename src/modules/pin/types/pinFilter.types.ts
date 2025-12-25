// src/modules/pin/types/pinFilter.types.ts

/**
 * Pin filter scope enum (matches API)
 */
export type PinScope = 
  | 'ALL' 
  | 'CREATED' 
  | 'SAVED'            // сохранено в доски
  | 'SAVED_TO_PROFILE' // сохранено в профиль (без доски)
  | 'SAVED_ALL'        // сохранено в доски ИЛИ профиль
  | 'LIKED' 
  | 'RELATED';

/**
 * Scope option for UI selection
 */
export interface PinScopeOption {
  value: PinScope;
  label: string;
  description?: string;
  icon?: 'pin' | 'board' | 'person' | 'heart' | 'sparkle';
  requiresAuth?: boolean;
}

/**
 * Available scope options for UI
 */
export const PIN_SCOPE_OPTIONS: PinScopeOption[] = [
  { 
    value: 'ALL', 
    label: 'All Pins', 
    description: 'Browse all pins',
    icon: 'sparkle',
  },
  { 
    value: 'CREATED', 
    label: 'Created', 
    description: 'Pins you created',
    icon: 'pin',
    requiresAuth: true,
  },
  { 
    value: 'SAVED', 
    label: 'Saved to Boards', 
    description: 'Pins saved to your boards',
    icon: 'board',
    requiresAuth: true,
  },
  { 
    value: 'SAVED_TO_PROFILE', 
    label: 'Saved to Profile', 
    description: 'Pins saved directly to profile',
    icon: 'person',
    requiresAuth: true,
  },
  { 
    value: 'SAVED_ALL', 
    label: 'All Saved', 
    description: 'All your saved pins',
    icon: 'board',
    requiresAuth: true,
  },
  { 
    value: 'LIKED', 
    label: 'Liked', 
    description: 'Pins you liked',
    icon: 'heart',
    requiresAuth: true,
  },
];

/**
 * Get scope options for a specific context
 */
export const getScopeOptionsForContext = (
  context: 'home' | 'profile' | 'user',
  isOwnProfile: boolean = false
): PinScopeOption[] => {
  switch (context) {
    case 'home':
      return PIN_SCOPE_OPTIONS;
    case 'profile':
      // Все опции для своего профиля
      return PIN_SCOPE_OPTIONS.filter(opt => 
        opt.value === 'ALL' || 
        opt.value === 'CREATED' || 
        opt.value === 'SAVED_ALL' ||
        opt.value === 'LIKED'
      );
    case 'user':
      // Для чужого профиля - только публичные
      if (isOwnProfile) {
        return PIN_SCOPE_OPTIONS.filter(opt => 
          opt.value === 'CREATED' || 
          opt.value === 'SAVED_ALL' ||
          opt.value === 'LIKED'
        );
      }
      return [
        { value: 'CREATED', label: 'Created', icon: 'pin' },
      ];
    default:
      return PIN_SCOPE_OPTIONS;
  }
};

/**
 * Pin filter for API requests
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

/**
 * Pin filter state for UI with additional metadata
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

/**
 * Helper to build filter for specific user context
 */
export const buildUserPinFilter = (
  userId: string,
  scope: PinScope
): PinFilter => {
  switch (scope) {
    case 'CREATED':
      return { authorId: userId, scope: 'CREATED' };
    case 'SAVED':
      return { savedBy: userId, scope: 'SAVED' };
    case 'SAVED_TO_PROFILE':
      return { savedToProfileBy: userId, scope: 'SAVED_TO_PROFILE' };
    case 'SAVED_ALL':
      return { savedBy: userId, scope: 'SAVED_ALL' };
    case 'LIKED':
      return { likedBy: userId, scope: 'LIKED' };
    default:
      return { authorId: userId };
  }
};

/**
 * Check if filter requires authentication
 */
export const filterRequiresAuth = (filter: PinFilter): boolean => {
  return !!(
    filter.savedBy ||
    filter.savedToProfileBy ||
    filter.likedBy ||
    (filter.scope && filter.scope !== 'ALL' && filter.scope !== 'RELATED')
  );
};