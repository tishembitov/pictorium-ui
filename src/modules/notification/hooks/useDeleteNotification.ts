// src/modules/notification/hooks/useDeleteNotification.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { notificationApi } from '../api/notificationApi';
import { useNotificationStore } from '../stores/notificationStore';
import { useToast } from '@/shared/hooks/useToast';
import type { PageNotificationResponse, NotificationResponse } from '../types/notification.types';
import type { InfiniteData } from '@tanstack/react-query';

// Helper to find notification and check if unread
const findNotificationStatus = (
  data: InfiniteData<PageNotificationResponse> | undefined,
  id: string
): boolean => {
  if (!data) return false;
  
  for (const page of data.pages) {
    const notification = page.content.find((n: NotificationResponse) => n.id === id);
    if (notification) {
      return notification.status === 'UNREAD';
    }
  }
  return false;
};

// Helper to remove notification from cache
const removeNotificationFromCache = (
  old: InfiniteData<PageNotificationResponse> | undefined,
  id: string
): InfiniteData<PageNotificationResponse> | undefined => {
  if (!old) return old;
  
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      content: page.content.filter((n: NotificationResponse) => n.id !== id),
      totalElements: page.totalElements - 1,
    })),
  };
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const decrementUnread = useNotificationStore((state) => state.decrementUnread);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<PageNotificationResponse>
      >(queryKeys.notifications.lists());

      const wasUnread = findNotificationStatus(previousNotifications, id);

      queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
        queryKeys.notifications.lists(),
        (old) => removeNotificationFromCache(old, id)
      );

      if (wasUnread) {
        decrementUnread(1);
      }

      return { previousNotifications, wasUnread };
    },

    onError: (_error, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.lists(),
          context.previousNotifications
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toast.error('Failed to delete notification');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });

  return {
    deleteNotification: mutation.mutate,
    deleteNotificationAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export default useDeleteNotification;