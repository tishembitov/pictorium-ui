// src/modules/notification/hooks/useMarkAsRead.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { notificationApi } from '../api/notificationApi';
import { useNotificationStore } from '../stores/notificationStore';
import { useToast } from '@/shared/hooks/useToast';
import type { PageNotificationResponse, NotificationResponse } from '../types/notification.types';
import type { InfiniteData } from '@tanstack/react-query';

// Helper to mark notifications as read in cache
const markNotificationsAsRead = (
  old: InfiniteData<PageNotificationResponse> | undefined,
  ids: string[]
): InfiniteData<PageNotificationResponse> | undefined => {
  if (!old) return old;
  
  const now = new Date().toISOString();
  
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      content: page.content.map((notification: NotificationResponse) =>
        ids.includes(notification.id)
          ? { ...notification, status: 'READ' as const, readAt: now }
          : notification
      ),
    })),
  };
};

// Helper to mark all notifications as read
const markAllNotificationsAsRead = (
  old: InfiniteData<PageNotificationResponse> | undefined
): InfiniteData<PageNotificationResponse> | undefined => {
  if (!old) return old;
  
  const now = new Date().toISOString();
  
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      content: page.content.map((notification: NotificationResponse) => ({
        ...notification,
        status: 'READ' as const,
        readAt: notification.readAt || now,
      })),
    })),
  };
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const decrementUnread = useNotificationStore((state) => state.decrementUnread);

  const mutation = useMutation({
    mutationFn: (ids: string[]) => notificationApi.markAsRead(ids),
    
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<PageNotificationResponse>
      >(queryKeys.notifications.lists());

      queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
        queryKeys.notifications.lists(),
        (old) => markNotificationsAsRead(old, ids)
      );

      decrementUnread(ids.length);

      return { previousNotifications };
    },

    onError: (_error, _ids, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.lists(),
          context.previousNotifications
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });

  return {
    markAsRead: mutation.mutate,
    markAsReadAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export const useMarkAllAsRead = () => {
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

      queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
        queryKeys.notifications.lists(),
        (old) => markAllNotificationsAsRead(old)
      );

      setUnreadCount(0);

      return { previousNotifications };
    },

    onSuccess: () => {
      toast.success('All notifications marked as read');
    },

    onError: (_error, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.lists(),
          context.previousNotifications
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toast.error('Failed to mark notifications as read');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });

  return {
    markAllAsRead: mutation.mutate,
    markAllAsReadAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export default useMarkAsRead;