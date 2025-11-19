// API URLs (из .env)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8010'
export const CONTENT_SERVICE_URL =
  import.meta.env.VITE_CONTENT_SERVICE_URL || 'http://localhost:8020'
export const STORAGE_SERVICE_URL =
  import.meta.env.VITE_STORAGE_SERVICE_URL || 'http://localhost:8088'

// Keycloak
export const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080'
export const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'pinterest-clone'
export const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'vue-app'

// File upload limits
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_VIDEO_DURATION = 30 // seconds

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/png',
  'image/bmp',
] as const

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'] as const

export const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES] as const

// Pin constraints (из старого кода)
export const MIN_IMAGE_WIDTH = 200
export const MIN_IMAGE_HEIGHT = 300

// Validation
export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30
export const PIN_TITLE_MAX_LENGTH = 200
export const PIN_DESCRIPTION_MAX_LENGTH = 400
export const COMMENT_MAX_LENGTH = 400
export const TAG_MAX_LENGTH = 100
export const BOARD_TITLE_MAX_LENGTH = 200

// Pagination
export const DEFAULT_PAGE_SIZE = 10
export const PINS_INITIAL_LIMIT = 15
export const PINS_NEXT_LIMIT = 5
export const TAGS_FILTER_LIMIT = 8
export const SEARCH_SUGGESTIONS_LIMIT = 5

// Timeouts
export const DEBOUNCE_DELAY = 300 // ms
export const TOAST_TIMEOUT = 5000 // ms
export const TYPING_INDICATOR_TIMEOUT = 2000 // ms
export const VIDEO_CONTROLS_HIDE_TIMEOUT = 2000 // ms

// Animations
export const LIKE_ANIMATION_DURATION = 500 // ms
export const CONFETTI_DURATION = 5000 // ms

// localStorage keys
export const STORAGE_KEYS = {
  RECENT_SEARCHES: 'pinterest_recent_searches',
  THEME: 'pinterest_theme',
  CHAT_SIZE: 'pinterest_chat_size',
  CHAT_SIDE: 'pinterest_chat_side',
  CHAT_COLOR: 'pinterest_chat_color',
} as const

// Colors (Tailwind variants для тегов и чатов)
export const TAG_COLORS = [
  'bg-red-200',
  'bg-orange-200',
  'bg-amber-200',
  'bg-lime-200',
  'bg-green-200',
  'bg-emerald-200',
  'bg-teal-200',
  'bg-sky-200',
  'bg-blue-200',
  'bg-indigo-200',
  'bg-violet-200',
  'bg-purple-200',
  'bg-fuchsia-200',
  'bg-pink-200',
  'bg-rose-200',
  'bg-cyan-200',
] as const

export const CHAT_COLORS = {
  red: { track: '#fca5a5', thumb: '#ef4444', bg: 'bg-red-300' },
  blue: { track: '#93c5fd', thumb: '#3b82f6', bg: 'bg-blue-300' },
  lime: { track: '#bef264', thumb: '#84cc16', bg: 'bg-lime-300' },
  yellow: { track: '#fde047', thumb: '#eab308', bg: 'bg-yellow-300' },
  purple: { track: '#d8b4fe', thumb: '#a855f7', bg: 'bg-purple-300' },
} as const

export type ChatColor = keyof typeof CHAT_COLORS

// Routes
export const ROUTES = {
  HOME: '/',
  PIN_DETAIL: '/pin/:id',
  CREATE_PIN: '/create-pin',
  USER_PROFILE: '/user/:username',
  BOARD_DETAIL: '/board/:id',
  MESSAGES: '/messages',
  RECOMMENDATIONS: '/recommendations/:id',
  SEARCH: '/search',
  PORTFOLIO: '/portfolio',
  NOT_FOUND: '/:pathMatch(.*)*',
} as const

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File is too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  IMAGE_TOO_SMALL: `Image must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}`,
  VIDEO_TOO_LONG: `Video must be ${MAX_VIDEO_DURATION} seconds or less`,
  NETWORK_ERROR: 'Network error. Please try again.',
  UNAUTHORIZED: 'You need to be logged in',
  FORBIDDEN: "You don't have permission",
} as const
