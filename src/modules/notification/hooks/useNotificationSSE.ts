// src/modules/notification/hooks/useNotificationSSE.ts

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth';
import { queryKeys } from '@/app/config/queryClient';
import { notificationSSEService } from '../services/sseService';
import { useNotificationStore } from '../stores/notificationStore';
import type { NotificationResponse, PageNotificationResponse } from '../types/notification.types';
import type { InfiniteData } from '@tanstack/react-query';

// ===== Helper Functions =====

const notificationExists = (
  pages: InfiniteData<PageNotificationResponse>['pages'],
  notificationId: string
): boolean => {
  return pages.some((page) =>
    page.content.some((n) => n.id === notificationId)
  );
};

const addNotificationToFirstPage = (
  pages: InfiniteData<PageNotificationResponse>['pages'],
  notification: NotificationResponse
): InfiniteData<PageNotificationResponse>['pages'] => {
  const firstPage = pages[0];
  if (!firstPage) return pages;

  return [
    {
      ...firstPage,
      content: [notification, ...firstPage.content],
      totalElements: firstPage.totalElements + 1,
    },
    ...pages.slice(1),
  ];
};

const createInitialNotificationsData = (
  notification: NotificationResponse
): InfiniteData<PageNotificationResponse> => ({
  pages: [{
    content: [notification],
    totalElements: 1,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: false,
  } as PageNotificationResponse],
  pageParams: [0],
});

const upsertNotification = (
  old: InfiniteData<PageNotificationResponse> | undefined,
  notification: NotificationResponse
): InfiniteData<PageNotificationResponse> => {
  if (!old) {
    return createInitialNotificationsData(notification);
  }

  if (notificationExists(old.pages, notification.id)) {
    return old;
  }

  return {
    ...old,
    pages: addNotificationToFirstPage(old.pages, notification),
  };
};

// ===== Deduplication =====

const processedNotificationIds = new Set<string>();

const markAsProcessed = (notificationId: string): boolean => {
  if (processedNotificationIds.has(notificationId)) {
    return false;
  }
  
  processedNotificationIds.add(notificationId);
  
  if (processedNotificationIds.size > 200) {
    const idsArray = Array.from(processedNotificationIds);
    const toRemove = idsArray.slice(0, -200);
    toRemove.forEach(id => processedNotificationIds.delete(id));
  }
  
  return true;
};

// ===== Main Hook =====

export const useNotificationSSE = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized } = useAuth();
  const isConnectedRef = useRef(false);

  const setConnected = useNotificationStore((state) => state.setConnected);
  const setConnecting = useNotificationStore((state) => state.setConnecting);
  const incrementUnread = useNotificationStore((state) => state.incrementUnread);
  const setLastEventTime = useNotificationStore((state) => state.setLastEventTime);
  const isConnected = useNotificationStore((state) => state.isConnected);
  const isConnecting = useNotificationStore((state) => state.isConnecting);

  // ===== Notification Handler =====
  const handleNotification = useCallback((notification: NotificationResponse) => {
    if (!markAsProcessed(notification.id)) {
      return;
    }

    setLastEventTime(Date.now());

    // Update all notifications list
    queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
      queryKeys.notifications.lists(),
      (old) => upsertNotification(old, notification)
    );

    // Update unread list and counter
    if (notification.status === 'UNREAD') {
      queryClient.setQueryData<InfiniteData<PageNotificationResponse>>(
        queryKeys.notifications.unread(),
        (old) => upsertNotification(old, notification)
      );

      incrementUnread();
    }

    queryClient.invalidateQueries({ 
      queryKey: queryKeys.notifications.unreadCount() 
    });
  }, [queryClient, incrementUnread, setLastEventTime]);

  // ===== Connection Change Handler =====
  const handleConnectionChange = useCallback((connected: boolean) => {
    setConnected(connected);
    setConnecting(false);
    isConnectedRef.current = connected;

    if (connected) {
      processedNotificationIds.clear();
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    }
  }, [setConnected, setConnecting, queryClient]);

  // ===== Connect/Disconnect Effect =====
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!isAuthenticated) {
      notificationSSEService.disconnect();
      setConnected(false);
      isConnectedRef.current = false;
      processedNotificationIds.clear();
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
  }, [isAuthenticated, isInitialized, handleNotification, handleConnectionChange, setConnecting, setConnected]);

  return {
    isConnected,
    isConnecting,
  };
};

export default useNotificationSSE;