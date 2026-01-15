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

  // ===== Notification Handler =====

  const handleNotification = useCallback(
    (notification: NotificationResponse, isUpdate: boolean) => {
      // Дедупликация с учётом updatedAt
      if (!markAsProcessed(notification.id, notification.updatedAt)) {
        return;
      }

      setLastEventTime(Date.now());

      if (isUpdate) {
        // Обновление существующего уведомления (агрегация)
        queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
          queryKeys.notifications.lists(),
          (old) => updateNotification(old, notification)
        );

        // Обновляем в unread списке если ещё не прочитано
        if (notification.status === 'UNREAD') {
          queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
            queryKeys.notifications.unread(),
            (old) => updateNotification(old, notification)
          );
        }

        // При агрегации НЕ увеличиваем счётчик - это обновление существующего
      } else {
        // Новое уведомление
        queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
          queryKeys.notifications.lists(),
          (old) => upsertNotification(old, notification)
        );

        if (notification.status === 'UNREAD') {
          queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
            queryKeys.notifications.unread(),
            (old) => upsertNotification(old, notification)
          );

          // Увеличиваем счётчик только для новых уведомлений
          incrementUnread();
        }
      }

      // Background invalidation
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
        refetchType: 'none',
      });
    },
    [queryClient, incrementUnread, setLastEventTime]
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
      }
    },
    [setConnected, setConnecting, queryClient]
  );

  // ===== Connect/Disconnect Effect =====

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