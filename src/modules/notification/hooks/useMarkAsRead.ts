// src/modules/notification/hooks/useMarkAsRead.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { notificationApi } from '../api/notificationApi';
import { useNotificationStore } from '../stores/notificationStore';
import { useToast } from '@/shared/hooks/useToast';
import {
  markNotificationsAsRead,
  markAllNotificationsAsRead,
} from '../utils/cacheHelpers';
import type { PageNotificationResponse } from '../types/notification.types';
import type { InfiniteData } from '@tanstack/react-query';

interface UseMarkAsReadOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export const useMarkAsRead = (options: UseMarkAsReadOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const decrementUnread = useNotificationStore((state) => state.decrementUnread);

  const mutation = useMutation({
    mutationFn: (ids: string[]) => notificationApi.markAsRead(ids),

    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<PageNotificationResponse>
      >(queryKeys.notifications.lists());

      // Optimistic update
      queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
        queryKeys.notifications.lists(),
        (old) => markNotificationsAsRead(old, ids)
      );

      decrementUnread(ids.length);

      return { previousNotifications };
    },

    onSuccess: () => {
      onSuccess?.();
    },

    onError: (error: Error, _ids, context) => {
      // Rollback
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.lists(),
          context.previousNotifications
        );
      }

      // Refetch to sync
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });

      onError?.(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
        refetchType: 'none',
      });
    },
  });

  return {
    markAsRead: mutation.mutate,
    markAsReadAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export const useMarkAllAsRead = (options: UseMarkAsReadOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<PageNotificationResponse>
      >(queryKeys.notifications.lists());

      // Optimistic update
      queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
        queryKeys.notifications.lists(),
        (old) => markAllNotificationsAsRead(old)
      );

      setUnreadCount(0);

      return { previousNotifications };
    },

    onSuccess: () => {
      if (showToast) {
        toast.success('All notifications marked as read');
      }
      onSuccess?.();
    },

    onError: (error: Error, _vars, context) => {
      // Rollback
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.lists(),
          context.previousNotifications
        );
      }

      // Refetch to sync
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      if (showToast) {
        toast.error('Failed to mark notifications as read');
      }
      onError?.(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
        refetchType: 'none',
      });
    },
  });

  return {
    markAllAsRead: mutation.mutate,
    markAllAsReadAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export default useMarkAsRead;