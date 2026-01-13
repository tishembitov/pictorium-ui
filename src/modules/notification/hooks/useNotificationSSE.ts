// src/modules/notification/hooks/useNotificationSSE.ts

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth';
import { queryKeys } from '@/app/config/queryClient';
import { notificationSSEService } from '../services/sseService';
import { useNotificationStore } from '../stores/notificationStore';
import type { NotificationResponse, PageNotificationResponse } from '../types/notification.types';
import type { InfiniteData } from '@tanstack/react-query';

// Helper to add notification to cache
const addNotificationToCache = (
  old: InfiniteData<PageNotificationResponse> | undefined,
  notification: NotificationResponse
): InfiniteData<PageNotificationResponse> | undefined => {
  if (!old) return old;

  const firstPage = old.pages[0];
  if (!firstPage) return old;

  // Check if notification already exists
  const exists = old.pages.some((page) =>
    page.content.some((n: NotificationResponse) => n.id === notification.id)
  );

  if (exists) return old;

  return {
    ...old,
    pages: [
      {
        ...firstPage,
        content: [notification, ...firstPage.content],
        totalElements: firstPage.totalElements + 1,
      },
      ...old.pages.slice(1),
    ],
  };
};

export const useNotificationSSE = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized } = useAuth();

  const setConnected = useNotificationStore((state) => state.setConnected);
  const setConnecting = useNotificationStore((state) => state.setConnecting);
  const incrementUnread = useNotificationStore((state) => state.incrementUnread);
  const setLastEventTime = useNotificationStore((state) => state.setLastEventTime);
  const isConnected = useNotificationStore((state) => state.isConnected);
  const isConnecting = useNotificationStore((state) => state.isConnecting);

  const handleNotification = useCallback((notification: NotificationResponse) => {
    setLastEventTime(Date.now());

    queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
      queryKeys.notifications.lists(),
      (old) => addNotificationToCache(old, notification)
    );

    if (notification.status === 'UNREAD') {
      incrementUnread();
    }

    queryClient.invalidateQueries({ 
      queryKey: queryKeys.notifications.unreadCount() 
    });
  }, [queryClient, incrementUnread, setLastEventTime]);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setConnected(connected);
    setConnecting(false);

    if (connected) {
      // Refetch notifications on reconnect
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    }
  }, [setConnected, setConnecting, queryClient]);

  // Connect when authenticated
  useEffect(() => {
    // Wait for auth to be initialized
    if (!isInitialized) {
      return;
    }

    if (!isAuthenticated) {
      // Disconnect if not authenticated
      notificationSSEService.disconnect();
      setConnected(false);
      return;
    }

    // Connect
    setConnecting(true);
    
    // ✅ connect() is now async
    notificationSSEService.connect().catch((error) => {
      console.error('[useNotificationSSE] Failed to connect:', error);
      setConnecting(false);
    });

    const unsubNotification = notificationSSEService.onNotification(handleNotification);
    const unsubConnection = notificationSSEService.onConnectionChange(handleConnectionChange);

    return () => {
      unsubNotification();
      unsubConnection();
    };
  }, [isAuthenticated, isInitialized, handleNotification, handleConnectionChange, setConnecting, setConnected]);

  return {
    isConnected,
    isConnecting,
  };
};

export default useNotificationSSE;