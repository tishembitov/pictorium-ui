// src/modules/notification/hooks/useNotifications.ts

import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { notificationApi } from '../api/notificationApi';
import { PAGINATION } from '@/shared/utils/constants';
import type { NotificationResponse } from '../types/notification.types';

interface UseNotificationsOptions {
  enabled?: boolean;
  unreadOnly?: boolean;
  pageSize?: number;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { 
    enabled = true, 
    unreadOnly = false, 
    pageSize = PAGINATION.DEFAULT_SIZE 
  } = options;

  const queryFn = unreadOnly 
    ? notificationApi.getUnreadNotifications 
    : notificationApi.getNotifications;

  const queryKey = unreadOnly 
    ? queryKeys.notifications.unread()
    : queryKeys.notifications.lists();

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      return queryFn({ 
        page: pageParam, 
        size: pageSize,
        sort: ['createdAt,desc'],
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => 
      lastPage.last ? undefined : lastPage.number + 1,
    enabled,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  // Extract notifications from pages - computed value without useMemo
  const pages = query.data?.pages;
  const notifications: NotificationResponse[] = pages 
    ? pages.flatMap((page) => page.content)
    : [];

  const totalElements = pages?.[0]?.totalElements ?? 0;

  return {
    notifications,
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

export default useNotifications;