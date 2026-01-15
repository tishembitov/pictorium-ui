// src/modules/notification/hooks/useNotificationSSE.ts

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth';
import { queryKeys } from '@/app/config/queryClient';
import { notificationSSEService } from '../services/sseService';
import { useNotificationStore } from '../stores/notificationStore';
import {
  upsertNotification,
  updateNotification,
  markAsProcessed,
  clearProcessedIds,
} from '../utils/cacheHelpers';
import type {
  NotificationResponse,
  PageNotificationResponse,
} from '../types/notification.types';
import type { InfiniteData } from '@tanstack/react-query';

type NotificationsInfiniteData = InfiniteData<PageNotificationResponse>;

// ===== Helper Functions (module level to reduce nesting) =====

const removeNotificationById = (
  data: NotificationsInfiniteData | undefined,
  notificationId: NotificationResponse['id']
): NotificationsInfiniteData | undefined => {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      content: page.content.filter((n) => n.id !== notificationId),
    })),
  };
};

const upsertOrUpdateNotification = (
  data: NotificationsInfiniteData | undefined,
  notification: NotificationResponse,
  isUpdate: boolean
): NotificationsInfiniteData | undefined => {
  if (isUpdate) {
    return updateNotification(data, notification);
  }
  return upsertNotification(data, notification);
};

// ===== Hook =====

export const useNotificationSSE = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized } = useAuth();
  const isConnectedRef = useRef(false);

  // Store actions
  const setConnected = useNotificationStore((state) => state.setConnected);
  const setConnecting = useNotificationStore((state) => state.setConnecting);
  const incrementUnread = useNotificationStore((state) => state.incrementUnread);
  const setLastEventTime = useNotificationStore((state) => state.setLastEventTime);

  // Store state
  const isConnected = useNotificationStore((state) => state.isConnected);
  const isConnecting = useNotificationStore((state) => state.isConnecting);

  // ===== Cache Updaters =====

  const updateMainList = useCallback(
    (notification: NotificationResponse, isUpdate: boolean) => {
      const queryKey = queryKeys.notifications.lists();

      queryClient.setQueryData<NotificationsInfiniteData>(queryKey, (old) =>
        upsertOrUpdateNotification(old, notification, isUpdate)
      );
    },
    [queryClient]
  );

  const updateUnreadList = useCallback(
    (notification: NotificationResponse, isUpdate: boolean) => {
      const unreadQueryKey = queryKeys.notifications.unread();

      if (notification.status === 'UNREAD') {
        queryClient.setQueryData<NotificationsInfiniteData>(unreadQueryKey, (old) =>
          upsertOrUpdateNotification(old, notification, isUpdate)
        );
      } else {
        // Удаляем из unread списка если прочитано
        queryClient.setQueryData<NotificationsInfiniteData>(unreadQueryKey, (old) =>
          removeNotificationById(old, notification.id)
        );
      }
    },
    [queryClient]
  );

  // ===== Notification Handler =====

  const handleNotification = useCallback(
    (notification: NotificationResponse, isUpdate: boolean) => {
      // Дедупликация с учётом updatedAt
      if (!markAsProcessed(notification.id, notification.updatedAt)) {
        console.debug('[SSE] Duplicate notification skipped:', notification.id);
        return;
      }

      setLastEventTime(Date.now());

      console.debug('[SSE] Processing notification:', {
        id: notification.id,
        type: notification.type,
        isUpdate,
        aggregatedCount: notification.aggregatedCount,
        status: notification.status,
      });

      // Обновляем кэши
      updateMainList(notification, isUpdate);
      updateUnreadList(notification, isUpdate);

      // Увеличиваем счётчик только для НОВЫХ UNREAD уведомлений
      if (!isUpdate && notification.status === 'UNREAD') {
        incrementUnread();
        console.debug('[SSE] Incremented unread count');
      }

      // Фоновая инвалидация счётчика
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
        refetchType: 'none',
      });
    },
    [queryClient, incrementUnread, setLastEventTime, updateMainList, updateUnreadList]
  );

  // ===== Connection Handler =====

  const handleConnectionChange = useCallback(
    (connected: boolean) => {
      setConnected(connected);
      setConnecting(false);
      isConnectedRef.current = connected;

      if (connected) {
        clearProcessedIds();

        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.all,
          refetchType: 'none',
        });

        console.debug('[SSE] Connected, cleared processed IDs');
      }
    },
    [setConnected, setConnecting, queryClient]
  );

  // ===== Connect Effect =====

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!isAuthenticated) {
      notificationSSEService.disconnect();
      setConnected(false);
      isConnectedRef.current = false;
      clearProcessedIds();
      return;
    }

    if (!isConnectedRef.current && !notificationSSEService.isConnected) {
      setConnecting(true);

      notificationSSEService.connect().catch((error) => {
        console.error('[useNotificationSSE] Failed to connect:', error);
        setConnecting(false);
      });
    }

    const unsubNotification = notificationSSEService.onNotification(handleNotification);
    const unsubConnection = notificationSSEService.onConnectionChange(handleConnectionChange);

    return () => {
      unsubNotification();
      unsubConnection();
    };
  }, [
    isAuthenticated,
    isInitialized,
    handleNotification,
    handleConnectionChange,
    setConnecting,
    setConnected,
  ]);

  return {
    isConnected,
    isConnecting,
  };
};

export default useNotificationSSE;