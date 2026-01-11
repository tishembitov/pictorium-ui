// src/app/router/routes.ts

/**
 * Route path constants
 * Отдельный файл без импортов компонентов для избежания циклических зависимостей
 */
export const ROUTES = {
    HOME: '/',
    EXPLORE: '/explore',
    SEARCH: '/search',
    PIN: '/pin/:pinId',
    PIN_CREATE: '/pin/create',
    PIN_EDIT: '/pin/:pinId/edit',
    PROFILE: '/profile/:username',
    SETTINGS: '/settings',
    BOARD: '/board/:boardId',
    FOLLOWERS: '/profile/:username/followers',
    FOLLOWING: '/profile/:username/following',
    MESSAGES: '/messages',
    MESSAGES_CHAT: '/messages/:chatId',
    NOT_FOUND: '/404',
    ERROR: '/error',
  } as const;
  
  /**
   * Path builders for dynamic routes
   */
  export const buildPath = {
    pin: (pinId: string) => `/pin/${pinId}`,
    pinEdit: (pinId: string) => `/pin/${pinId}/edit`,
    profile: (username: string) => `/profile/${username}`,
    board: (boardId: string) => `/board/${boardId}`,
    followers: (username: string) => `/profile/${username}/followers`,
    following: (username: string) => `/profile/${username}/following`,
    search: (query?: string) => query ? `/search?q=${encodeURIComponent(query)}` : '/search',
    messages: (chatId?: string) => chatId ? `/messages/${chatId}` : '/messages',
  } as const;
  
  export type RoutePath = typeof ROUTES[keyof typeof ROUTES];