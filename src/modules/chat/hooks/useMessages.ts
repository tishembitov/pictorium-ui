// src/modules/chat/hooks/useMessages.ts

import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { messageApi } from '../api/messageApi';
import { PAGINATION } from '@/shared/utils/constants';
import type { 
  MessageResponse, 
  ChatResponse, 
  MessagesInfiniteData,
} from '../types/chat.types';

interface UseMessagesOptions {
  enabled?: boolean;
  pageSize?: number;
}

/**
 * Hook to get messages with infinite scroll
 */
export const useMessages = (chatId: string | null | undefined, options: UseMessagesOptions = {}) => {
  const { enabled = true, pageSize = PAGINATION.COMMENTS_SIZE } = options;

  const query = useInfiniteQuery({
    queryKey: queryKeys.chats.messagesInfinite(chatId || ''),
    queryFn: ({ pageParam = 0 }) =>
      messageApi.getMessages(chatId!, { 
        page: pageParam, 
        size: pageSize,
        sort: ['createdAt,desc'],
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => 
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: enabled && !!chatId,
    staleTime: 1000 * 30,
  });

  // Flatten pages and reverse to show oldest first
  const messages: MessageResponse[] = query.data?.pages
    .flatMap((page) => page.content)
    .reverse() || [];

  const totalElements = query.data?.pages[0]?.totalElements ?? 0;

  return {
    messages,
    totalElements,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get all messages (for small chats)
 */
export const useAllMessages = (chatId: string | null | undefined, options: UseMessagesOptions = {}) => {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: queryKeys.chats.messages(chatId || ''),
    queryFn: () => messageApi.getAllMessages(chatId!),
    enabled: enabled && !!chatId,
    staleTime: 1000 * 30,
  });

  return {
    messages: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to add message to cache optimistically
 */
export const useAddMessageToCache = () => {
  const queryClient = useQueryClient();

  const addMessage = (chatId: string, message: MessageResponse) => {
    // Update infinite query
    queryClient.setQueryData<MessagesInfiniteData>(
      queryKeys.chats.messagesInfinite(chatId),
      (old) => {
        if (!old) return old;
        
        const newPages = [...old.pages];
        const firstPage = newPages[0];
        if (firstPage) {
          newPages[0] = {
            ...firstPage,
            content: [message, ...firstPage.content],
          };
        }
        
        return { ...old, pages: newPages };
      }
    );

    // Update chats list with last message
    queryClient.setQueryData<ChatResponse[]>(
      queryKeys.chats.lists(),
      (old) => {
        if (!old) return old;
        
        return old.map((chat) => {
          if (chat.id === chatId) {
            return {
              ...chat,
              lastMessage: message.content || 'Attachment',
              lastMessageTime: message.createdAt,
            };
          }
          return chat;
        });
      }
    );
  };

  return { addMessage };
};

export default useMessages;