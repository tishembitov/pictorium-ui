// src/modules/chat/hooks/useTotalUnread.ts

import { useEffect, useMemo } from 'react';
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

  // Fetch chats
  const { data: chats } = useQuery({
    queryKey: queryKeys.chats.lists(),
    queryFn: chatApi.getMyChats,
    staleTime: 1000 * 60 * 2,
  });

  // Calculate total from chats
  const calculatedTotal = useMemo(() => {
    if (!chats) return 0;
    return chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
  }, [chats]);

  // Sync to store when chats change
  useEffect(() => {
    if (chats) {
      setTotalUnread(calculatedTotal);
    }
  }, [chats, calculatedTotal, setTotalUnread]);

  return totalUnread;
};

export default useTotalUnread;