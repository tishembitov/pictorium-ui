// src/modules/notification/hooks/useDeleteNotification.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { notificationApi } from '../api/notificationApi';
import { useNotificationStore } from '../stores/notificationStore';
import { useToast } from '@/shared/hooks/useToast';
import {
  findNotificationStatus,
  removeNotificationFromCache,
} from '../utils/cacheHelpers';
import type { PageNotificationResponse } from '../types/notification.types';
import type { InfiniteData } from '@tanstack/react-query';

interface UseDeleteNotificationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export const useDeleteNotification = (options: UseDeleteNotificationOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
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

      // Optimistic update
      queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
        queryKeys.notifications.lists(),
        (old) => removeNotificationFromCache(old, id)
      );

      if (wasUnread) {
        decrementUnread(1);
      }

      return { previousNotifications, wasUnread };
    },

    onSuccess: () => {
      onSuccess?.();
    },

    onError: (error: Error, _id, context) => {
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
        toast.error('Failed to delete notification');
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
    deleteNotification: mutation.mutate,
    deleteNotificationAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export default useDeleteNotification;