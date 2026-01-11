// src/app/config/queryClient.ts

import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: (failureCount, error: unknown) => {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status && err.response.status >= 400 && err.response.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: false,
  },
};

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions,
  });
};

export const queryClient = createQueryClient();

/**
 * Query Keys Factory
 * 
 * Структура:
 * - `all` — корневой ключ для полной инвалидации модуля
 * - `lists()` — все списки (для инвалидации гридов)
 * - `list(filter)` — конкретный список с фильтром
 * - `byId(id)` — детали сущности
 * - Специфичные ключи для вложенных данных
 */
export const queryKeys = {
  // ==================== Users ====================
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    byId: (id: string) => [...queryKeys.users.all, 'byId', id] as const,
    byUsername: (username: string) => [...queryKeys.users.all, 'byUsername', username] as const,
  },
  
  // ==================== Subscriptions ====================
  subscriptions: {
    all: ['subscriptions'] as const,
    followers: (userId: string) => [...queryKeys.subscriptions.all, 'followers', userId] as const,
    following: (userId: string) => [...queryKeys.subscriptions.all, 'following', userId] as const,
    check: (userId: string) => [...queryKeys.subscriptions.all, 'check', userId] as const,
  },
  
  // ==================== Pins ====================
  pins: {
    all: ['pins'] as const,
    
    // Списки
    lists: () => [...queryKeys.pins.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.pins.lists(), filters] as const,
    
    // Детали
    byId: (id: string) => [...queryKeys.pins.all, 'byId', id] as const,
    
    // Вложенные данные пина
    likes: (pinId: string) => [...queryKeys.pins.all, 'likes', pinId] as const,
    comments: (pinId: string) => [...queryKeys.pins.all, 'comments', pinId] as const,
  },
  
  // ==================== Boards ====================
  boards: {
    all: ['boards'] as const,
    
    // Списки
    my: () => [...queryKeys.boards.all, 'my'] as const,
    byUser: (userId: string) => [...queryKeys.boards.all, 'byUser', userId] as const,
    forPin: (pinId: string) => [...queryKeys.boards.all, 'forPin', pinId] as const,
    
    // Детали
    byId: (boardId: string) => [...queryKeys.boards.all, 'byId', boardId] as const,
    
    // Вложенные данные доски
    pins: (boardId: string) => [...queryKeys.boards.all, 'pins', boardId] as const,
    
    // Selected board
    selected: () => [...queryKeys.boards.all, 'selected'] as const,
  },
  
  // ==================== Comments ====================
  comments: {
    all: ['comments'] as const,
    byId: (id: string) => [...queryKeys.comments.all, 'byId', id] as const,
    replies: (commentId: string) => [...queryKeys.comments.all, 'replies', commentId] as const,
    likes: (commentId: string) => [...queryKeys.comments.all, 'likes', commentId] as const,
  },
  
  // ==================== Tags ====================
  tags: {
    all: ['tags'] as const,
    lists: () => [...queryKeys.tags.all, 'list'] as const,
    list: (page?: number) => [...queryKeys.tags.lists(), page] as const,
    byId: (id: string) => [...queryKeys.tags.all, 'byId', id] as const,
    search: (query: string) => [...queryKeys.tags.all, 'search', query] as const,
    byPin: (pinId: string) => [...queryKeys.tags.all, 'byPin', pinId] as const,
    categories: (limit?: number) => [...queryKeys.tags.all, 'categories', limit] as const,
  },
  
  // ==================== Images ====================
  images: {
    all: ['images'] as const,
    metadata: (imageId: string) => [...queryKeys.images.all, 'metadata', imageId] as const,
    url: (imageId: string, expiry?: number) => [...queryKeys.images.all, 'url', imageId, expiry] as const,
    list: (category?: string) => [...queryKeys.images.all, 'list', category] as const,
  },

  chats: {
    all: ['chats'] as const,
    lists: () => [...queryKeys.chats.all, 'list'] as const,
    byId: (chatId: string) => [...queryKeys.chats.all, 'byId', chatId] as const,
    withUser: (recipientId: string) => [...queryKeys.chats.all, 'with', recipientId] as const,
    
    // Messages
    messages: (chatId: string) => [...queryKeys.chats.all, chatId, 'messages'] as const,
    messagesInfinite: (chatId: string) => [...queryKeys.chats.all, chatId, 'messages', 'infinite'] as const,
    unreadCount: (chatId: string) => [...queryKeys.chats.all, chatId, 'unread'] as const,
    totalUnread: () => [...queryKeys.chats.all, 'totalUnread'] as const,
  },
  
  // ==================== Presence ====================
  presence: {
    all: ['presence'] as const,
    byUser: (userId: string) => [...queryKeys.presence.all, userId] as const,
    batch: (userIds: string[]) => [...queryKeys.presence.all, 'batch', ...userIds.sort()] as const,
  },
  
} as const;


export default queryClient;