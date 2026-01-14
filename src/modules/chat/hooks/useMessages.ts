// src/modules/chat/hooks/useMessages.ts

import { useCallback } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { messageApi } from '../api/messageApi';
import { PAGINATION } from '@/shared/utils/constants';
import {
  upsertMessage,
  createInitialMessagesData,
  updateChatInList,
} from '../utils/cacheHelpers';
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
 * Flatten and reverse messages from pages
 */
const flattenMessages = (
  pages: MessagesInfiniteData['pages'] | undefined
): MessageResponse[] => {
  if (!pages) return [];
  return pages.flatMap((page) => page.content).reverse();
};

/**
 * Hook to get messages with infinite scroll
 */
export const useMessages = (
  chatId: string | null | undefined,
  options: UseMessagesOptions = {}
) => {
  const { enabled = true, pageSize = PAGINATION.COMMENTS_SIZE } = options;

  const query = useInfiniteQuery({
    queryKey: queryKeys.chats.messagesInfinite(chatId || ''),
    queryFn: async ({ pageParam = 0 }) => {
      const result = await messageApi.getMessages(chatId!, {
        page: pageParam,
        size: pageSize,
        sort: ['createdAt,desc'],
      });
      return result;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: enabled && !!chatId,
    staleTime: 1000 * 30,
    refetchOnMount: true,
  });

  // Flatten pages and reverse to show oldest first
  const pages = query.data?.pages;
  const messages = flattenMessages(pages);
  const totalElements = pages?.[0]?.totalElements ?? 0;

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
export const useAllMessages = (
  chatId: string | null | undefined,
  options: UseMessagesOptions = {}
) => {
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

  const addMessage = useCallback(
    (chatId: string, message: MessageResponse) => {
      // Update infinite query
      queryClient.setQueryData<MessagesInfiniteData>(
        queryKeys.chats.messagesInfinite(chatId),
        (old) => {
          if (!old) {
            return createInitialMessagesData(message);
          }
          return {
            ...old,
            pages: upsertMessage(old.pages, message),
          };
        }
      );

      // Update chats list
      queryClient.setQueryData<ChatResponse[]>(
        queryKeys.chats.lists(),
        (old) => {
          if (!old) return old;
          return updateChatInList(old, {
            chatId,
            lastMessage: message.type === 'TEXT' ? message.content : null,
            lastMessageTime: message.createdAt,
            lastMessageType: message.type,
            lastMessageImageId: message.imageId,
          });
        }
      );
    },
    [queryClient]
  );

  return { addMessage };
};

export default useMessages;