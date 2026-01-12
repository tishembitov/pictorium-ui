// src/modules/chat/hooks/useChats.ts

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/app/config/queryClient';
import { chatApi } from '../api/chatApi';
import { useUsers } from './useRecipients';
import type { ChatWithRecipient } from '../types/chat.types';

interface UseChatsOptions {
  enabled?: boolean;
}

export const useChats = (options: UseChatsOptions = {}) => {
  const { enabled = true } = options;

  // 1. Загружаем чаты
  const chatsQuery = useQuery({
    queryKey: queryKeys.chats.lists(),
    queryFn: () => chatApi.getMyChats(),
    enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });

  // 2. Мемоизируем chats отдельно
  const chats = useMemo(() => {
    return chatsQuery.data || [];
  }, [chatsQuery.data]);

  // 3. Собираем recipientIds
  const recipientIds = useMemo(() => {
    return [...new Set(chats.map((chat) => chat.recipientId).filter(Boolean))];
  }, [chats]);

  // 4. Загружаем пользователей
  const { users, isLoading: isLoadingUsers } = useUsers(recipientIds);

  // 5. Объединяем данные
  const enrichedChats: ChatWithRecipient[] = useMemo(() => {
    return chats.map((chat) => {
      const user = users[chat.recipientId];
      return {
        ...chat,
        recipient: user
          ? {
              id: user.id,
              username: user.username,
              imageId: user.imageId,
            }
          : undefined,
      };
    });
  }, [chats, users]);

  return {
    chats: enrichedChats,
    isLoading: chatsQuery.isLoading || isLoadingUsers,
    isError: chatsQuery.isError,
    error: chatsQuery.error,
    refetch: chatsQuery.refetch,
  };
};

export default useChats;