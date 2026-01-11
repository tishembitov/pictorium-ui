// src/modules/chat/hooks/useMarkAsRead.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { messageApi } from '../api/messageApi';
import { useChatStore } from '../stores/chatStore';
import type { ChatResponse } from '../types/chat.types';

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const decrementTotalUnread = useChatStore((state) => state.decrementTotalUnread);

  const mutation = useMutation({
    mutationFn: (chatId: string) => messageApi.markAsRead(chatId),

    onMutate: async (chatId) => {
      // Get current unread count for this chat
      const chats = queryClient.getQueryData<ChatResponse[]>(queryKeys.chats.lists());
      const chat = chats?.find((c) => c.id === chatId);
      const previousUnread = chat?.unreadCount || 0;

      // Optimistically update unread count
      queryClient.setQueryData<ChatResponse[]>(
        queryKeys.chats.lists(),
        (old) => {
          if (!old) return old;
          return old.map((c) => 
            c.id === chatId ? { ...c, unreadCount: 0 } : c
          );
        }
      );

      // Update total unread
      if (previousUnread > 0) {
        decrementTotalUnread(previousUnread);
      }

      return { previousUnread };
    },

    onError: (_error, _chatId, context) => {
      // Rollback on error
      if (context?.previousUnread) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
      }
    },
  });

  return {
    markAsRead: mutation.mutate,
    markAsReadAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export default useMarkAsRead;