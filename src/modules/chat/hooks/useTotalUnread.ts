// src/modules/chat/hooks/useTotalUnread.ts

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { chatApi } from '../api/chatApi';
import { useChatStore } from '../stores/chatStore';

/**
 * Hook to get and sync total unread count
 */
export const useTotalUnread = () => {
  const setTotalUnread = useChatStore((state) => state.setTotalUnread);
  const totalUnread = useChatStore((state) => state.totalUnread);

  // Fetch chats and calculate total unread
  const { data: chats } = useQuery({
    queryKey: queryKeys.chats.lists(),
    queryFn: chatApi.getMyChats,
    staleTime: 1000 * 60 * 2,
  });

  // Sync total unread from chats
  useEffect(() => {
    if (chats) {
      const total = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
      setTotalUnread(total);
    }
  }, [chats, setTotalUnread]);

  return totalUnread;
};

export default useTotalUnread;