// src/modules/chat/hooks/useChats.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { chatApi } from '../api/chatApi';
import type { ChatWithRecipient } from '../types/chat.types';

interface UseChatsOptions {
  enabled?: boolean;
}

export const useChats = (options: UseChatsOptions = {}) => {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: queryKeys.chats.lists(),
    queryFn: async () => {
      const chats = await chatApi.getMyChats();
      return chats;
    },
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // Prefetch recipient data
  const chatsWithRecipients: ChatWithRecipient[] = query.data || [];


  return {
    chats: chatsWithRecipients,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useChats;