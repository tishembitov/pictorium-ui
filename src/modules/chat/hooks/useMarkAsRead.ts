// src/modules/chat/hooks/useMarkAsRead.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { messageApi } from '../api/messageApi';
import { useChatStore } from '../stores/chatStore';
import { updateChatUnreadCount } from '../utils/cacheHelpers';
import type { ChatResponse } from '../types/chat.types';

interface UseMarkAsReadOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useMarkAsRead = (options: UseMarkAsReadOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const decrementTotalUnread = useChatStore((state) => state.decrementTotalUnread);

  const mutation = useMutation({
    mutationFn: (chatId: string) => messageApi.markAsRead(chatId),

    onMutate: async (chatId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.chats.lists() });

      const previousChats = queryClient.getQueryData<ChatResponse[]>(
        queryKeys.chats.lists()
      );

      const chat = previousChats?.find((c) => c.id === chatId);
      const previousUnread = chat?.unreadCount || 0;

      // Optimistic update
      queryClient.setQueryData<ChatResponse[]>(
        queryKeys.chats.lists(),
        (old) => (old ? updateChatUnreadCount(old, chatId, 0) : old)
      );

      if (previousUnread > 0) {
        decrementTotalUnread(previousUnread);
      }

      return { previousChats, previousUnread };
    },

    onSuccess: () => {
      onSuccess?.();
    },

    onError: (error: Error, _chatId, context) => {
      // Rollback
      if (context?.previousChats) {
        queryClient.setQueryData(queryKeys.chats.lists(), context.previousChats);
      }

      onError?.(error);
    },
  });

  return {
    markAsRead: mutation.mutate,
    markAsReadAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export default useMarkAsRead;