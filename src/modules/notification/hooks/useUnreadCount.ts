// src/modules/notification/hooks/useUnreadCount.ts

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { notificationApi } from '../api/notificationApi';
import { useNotificationStore } from '../stores/notificationStore';
import { notificationSSEService } from '../services/sseService';
import { useAuth } from '@/modules/auth';

interface UseUnreadCountOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export const useUnreadCount = (options: UseUnreadCountOptions = {}) => {
  const { enabled = true, refetchInterval = 60000 } = options;
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const storeUnreadCount = useNotificationStore((state) => state.unreadCount);

  const query = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const response = await notificationApi.getUnreadCount();
      return response.count;
    },
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 30,
    refetchInterval,
    refetchOnWindowFocus: true,
  });

  // Sync query data to store
  useEffect(() => {
    if (query.data !== undefined) {
      setUnreadCount(query.data);
    }
  }, [query.data, setUnreadCount]);

  // Subscribe to SSE unread updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = notificationSSEService.onUnreadUpdate((count) => {
      setUnreadCount(count);
      // Также обновляем query cache
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), count);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, setUnreadCount, queryClient]);

  return {
    unreadCount: storeUnreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useUnreadCountValue = () => {
  return useNotificationStore((state) => state.unreadCount);
};

export default useUnreadCount;