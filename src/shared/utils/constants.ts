// src/shared/utils/constants.ts

// App constants
export const APP_NAME = 'Pictorium';

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 20,
  MAX_SIZE: 100,
  PIN_GRID_SIZE: 25,
  COMMENTS_SIZE: 10,
  USERS_SIZE: 20,
} as const;

// Image constraints
export const IMAGE = {
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
  THUMBNAIL: {
    MIN_WIDTH: 50,
    MIN_HEIGHT: 50,
    MAX_WIDTH: 1000,
    MAX_HEIGHT: 1000,
    DEFAULT_WIDTH: 236,
    DEFAULT_HEIGHT: 236,
  },
  CATEGORY: {
    PIN: 'pins',
    AVATAR: 'avatars',
    BANNER: 'banners',
    COMMENT: 'comments',
  },
} as const;

// Text constraints - согласно API validation
export const TEXT_LIMITS = {
  PIN_TITLE: 200,
  PIN_DESCRIPTION: 400,
  PIN_HREF: 200,
  COMMENT_CONTENT: 400,
  BOARD_TITLE: 200,
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  USER_DESCRIPTION: 200,
  TAG_NAME: 100,
  SOCIAL_LINK: 100,
} as const;

// Time constants (in ms)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  TOKEN_REFRESH_INTERVAL: 10000,
  TOKEN_MIN_VALIDITY: 30, // seconds
} as const;

// Breakpoints (matching Gestalt)
export const BREAKPOINTS = {
  SM: 576,
  MD: 768,
  LG: 1312,
} as const;

export const LAYOUT = {
  HEADER_HEIGHT: 80,           // Увеличено с 64 для большего аватара
  SIDEBAR_WIDTH: 180,
  SIDEBAR_COLLAPSED_WIDTH: 56,
  MAX_CONTENT_WIDTH: 1600,
  CONTENT_PADDING: 8,
} as const;
// Masonry grid settings
export const MASONRY = {
  COLUMN_WIDTH: 236,
  GUTTER_WIDTH: 8,  // Минимальные отступы между карточками
  MIN_COLUMNS: 2,
} as const;

// Z-index layers
export const Z_INDEX = {
  DROPDOWN: 100,
  STICKY: 200,
  MODAL: 300,
  POPOVER: 400,
  TOAST: 500,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  COLOR_SCHEME: 'pinthis-color-scheme',
  SELECTED_BOARD: 'pinthis-selected-board',
  RECENT_SEARCHES: 'pinthis-recent-searches',
  AUTH_STATE: 'pinthis-auth-state',
} as const;

// Query keys prefixes (для обратной совместимости)
export const QUERY_KEYS = {
  USERS: 'users',
  PINS: 'pins',
  BOARDS: 'boards',
  COMMENTS: 'comments',
  TAGS: 'tags',
  IMAGES: 'images',
  SUBSCRIPTIONS: 'subscriptions',
} as const;

// ✅ ИСПРАВЛЕНИЕ: ROUTES удалены - используйте импорт из @/app/router/routeConfig
// import { ROUTES, buildPath } from '@/app/router/routeConfig';

// Pin filter scopes - согласно API enum
export const PIN_SCOPES = {
  ALL: 'ALL',
  CREATED: 'CREATED',
  SAVED: 'SAVED',
  LIKED: 'LIKED',
  RELATED: 'RELATED',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'This file type is not supported.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PIN_CREATED: 'Pin created successfully!',
  PIN_UPDATED: 'Pin updated successfully!',
  PIN_DELETED: 'Pin deleted successfully!',
  PIN_SAVED: 'Pin saved to board!',
  PIN_UNSAVED: 'Pin removed from board.',
  PIN_LIKED: 'Pin liked!',
  PIN_UNLIKED: 'Like removed.',
  COMMENT_CREATED: 'Comment added!',
  COMMENT_UPDATED: 'Comment updated!',
  COMMENT_DELETED: 'Comment deleted.',
  BOARD_CREATED: 'Board created!',
  BOARD_DELETED: 'Board deleted.',
  PROFILE_UPDATED: 'Profile updated!',
  FOLLOWED: 'Following user.',
  UNFOLLOWED: 'Unfollowed user.',
  COPIED_TO_CLIPBOARD: 'Copied to clipboard!',
  IMAGE_UPLOADED: 'Image uploaded successfully!',
} as const;