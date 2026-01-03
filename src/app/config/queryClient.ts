// src/app/config/queryClient.ts

import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
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

// Query Keys Factory
export const queryKeys = {
  // User
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    byId: (id: string) => [...queryKeys.users.all, 'byId', id] as const,
    byUsername: (username: string) => [...queryKeys.users.all, 'byUsername', username] as const,
  },
  
  // Subscriptions
  subscriptions: {
    all: ['subscriptions'] as const,
    followers: (userId: string) => [...queryKeys.subscriptions.all, 'followers', userId] as const,
    following: (userId: string) => [...queryKeys.subscriptions.all, 'following', userId] as const,
    check: (userId: string) => [...queryKeys.subscriptions.all, 'check', userId] as const,
  },
  
  // Pins
  pins: {
    all: ['pins'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.pins.all, 'list', filters] as const,
    byId: (id: string) => [...queryKeys.pins.all, 'byId', id] as const,
    likes: (pinId: string) => [...queryKeys.pins.all, 'likes', pinId] as const,
    comments: (pinId: string) => [...queryKeys.pins.all, 'comments', pinId] as const,
    byAuthor: (userId: string) => [...queryKeys.pins.all, 'byAuthor', userId] as const,
    savedBy: (userId: string) => [...queryKeys.pins.all, 'savedBy', userId] as const,
    likedBy: (userId: string) => [...queryKeys.pins.all, 'likedBy', userId] as const,
    related: (pinId: string) => [...queryKeys.pins.all, 'related', pinId] as const,
    // ✅ Убраны: savedToProfile, mySavedToProfile
  },
  
  // Boards
  boards: {
    all: ['boards'] as const,
    byId: (boardId: string) => ['boards', 'byId', boardId] as const,
    byUser: (userId: string) => ['boards', 'byUser', userId] as const,
    my: () => ['boards', 'my'] as const,
    forPin: (pinId: string) => ['boards', 'forPin', pinId] as const,
    pins: (boardId: string) => ['boards', 'pins', boardId] as const,
    selected: () => ['boards', 'selected'] as const,
  },
  
  // Comments
  comments: {
    all: ['comments'] as const,
    byId: (id: string) => [...queryKeys.comments.all, 'byId', id] as const,
    replies: (commentId: string) => [...queryKeys.comments.all, 'replies', commentId] as const,
    likes: (commentId: string) => [...queryKeys.comments.all, 'likes', commentId] as const,
  },
  
  // Tags
  tags: {
    all: ['tags'] as const,
    list: (page?: number) => [...queryKeys.tags.all, 'list', page] as const,
    byId: (id: string) => [...queryKeys.tags.all, 'byId', id] as const,
    search: (query: string) => [...queryKeys.tags.all, 'search', query] as const,
    byPin: (pinId: string) => [...queryKeys.tags.all, 'byPin', pinId] as const,
    categories: (limit?: number) => [...queryKeys.tags.all, 'categories', limit] as const,
  },
  
  // Images
  images: {
    all: ['images'] as const,
    metadata: (imageId: string) => [...queryKeys.images.all, 'metadata', imageId] as const,
    url: (imageId: string, expiry?: number) => [...queryKeys.images.all, 'url', imageId, expiry] as const,
    list: (category?: string) => [...queryKeys.images.all, 'list', category] as const,
  },
} as const;

export default queryClient;