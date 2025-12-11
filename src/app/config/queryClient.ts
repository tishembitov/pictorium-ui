import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
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
    list: (filters?: Record<string, any>) => [...queryKeys.pins.all, 'list', filters] as const,
    byId: (id: string) => [...queryKeys.pins.all, 'byId', id] as const,
    likes: (pinId: string) => [...queryKeys.pins.all, 'likes', pinId] as const,
    comments: (pinId: string) => [...queryKeys.pins.all, 'comments', pinId] as const,
  },
  
  // Boards
  boards: {
    all: ['boards'] as const,
    byId: (id: string) => [...queryKeys.boards.all, 'byId', id] as const,
    my: () => [...queryKeys.boards.all, 'my'] as const,
    byUser: (userId: string) => [...queryKeys.boards.all, 'byUser', userId] as const,
    pins: (boardId: string) => [...queryKeys.boards.all, 'pins', boardId] as const,
    selected: () => [...queryKeys.boards.all, 'selected'] as const,
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
    byId: (id: string) => [...queryKeys.tags.all, 'byId', id] as const,
    search: (query: string) => [...queryKeys.tags.all, 'search', query] as const,
    byPin: (pinId: string) => [...queryKeys.tags.all, 'byPin', pinId] as const,
    categories: () => [...queryKeys.tags.all, 'categories'] as const,
  },
  
  // Images
  images: {
    all: ['images'] as const,
    metadata: (imageId: string) => [...queryKeys.images.all, 'metadata', imageId] as const,
    url: (imageId: string) => [...queryKeys.images.all, 'url', imageId] as const,
    list: (category?: string) => [...queryKeys.images.all, 'list', category] as const,
  },
} as const;

export default queryClient;