// src/modules/notification/hooks/useUnreadCount.ts

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { notificationApi } from '../api/notificationApi';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuth } from '@/modules/auth';

interface UseUnreadCountOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export const useUnreadCount = (options: UseUnreadCountOptions = {}) => {
  const { enabled = true, refetchInterval = 60000 } = options;
  const { isAuthenticated } = useAuth();
  
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

  useEffect(() => {
    if (query.data !== undefined) {
      setUnreadCount(query.data);
    }
  }, [query.data, setUnreadCount]);

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