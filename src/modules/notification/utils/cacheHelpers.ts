// src/modules/notification/utils/cacheHelpers.ts

import type {
    NotificationResponse,
    PageNotificationResponse,
  } from '../types/notification.types';
  import type { InfiniteData } from '@tanstack/react-query';
  
  type NotificationsInfiniteData = InfiniteData<PageNotificationResponse>;
  
  // ===== Notification Helpers =====
  
  /**
   * Проверяет, существует ли уведомление в страницах
   */
  export const notificationExistsInPages = (
    pages: NotificationsInfiniteData['pages'],
    notificationId: string
  ): boolean => {
    return pages.some((page) =>
      page.content.some((n) => n.id === notificationId)
    );
  };
  
  /**
   * Добавляет уведомление в начало первой страницы
   */
  export const addNotificationToFirstPage = (
    pages: NotificationsInfiniteData['pages'],
    notification: NotificationResponse
  ): NotificationsInfiniteData['pages'] => {
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
  
  /**
   * Создает начальные данные для infinite query
   */
  export const createInitialNotificationsData = (
    notification: NotificationResponse
  ): NotificationsInfiniteData => ({
    pages: [
      {
        content: [notification],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: false,
      } as PageNotificationResponse,
    ],
    pageParams: [0],
  });
  
  /**
   * Добавляет уведомление (upsert)
   */
  export const upsertNotification = (
    old: NotificationsInfiniteData | undefined,
    notification: NotificationResponse
  ): NotificationsInfiniteData => {
    if (!old) {
      return createInitialNotificationsData(notification);
    }
  
    if (notificationExistsInPages(old.pages, notification.id)) {
      return old;
    }
  
    return {
      ...old,
      pages: addNotificationToFirstPage(old.pages, notification),
    };
  };
  
  /**
   * Помечает уведомления как прочитанные
   */
  export const markNotificationsAsRead = (
    old: NotificationsInfiniteData | undefined,
    ids: string[]
  ): NotificationsInfiniteData | undefined => {
    if (!old) return old;
  
    const now = new Date().toISOString();
  
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        content: page.content.map((notification) =>
          ids.includes(notification.id)
            ? { ...notification, status: 'READ' as const, readAt: now }
            : notification
        ),
      })),
    };
  };
  
  /**
   * Помечает все уведомления как прочитанные
   */
  export const markAllNotificationsAsRead = (
    old: NotificationsInfiniteData | undefined
  ): NotificationsInfiniteData | undefined => {
    if (!old) return old;
  
    const now = new Date().toISOString();
  
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        content: page.content.map((notification) => ({
          ...notification,
          status: 'READ' as const,
          readAt: notification.readAt || now,
        })),
      })),
    };
  };
  
  /**
   * Удаляет уведомление из кэша
   */
  export const removeNotificationFromCache = (
    old: NotificationsInfiniteData | undefined,
    id: string
  ): NotificationsInfiniteData | undefined => {
    if (!old) return old;
  
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        content: page.content.filter((n) => n.id !== id),
        totalElements: page.totalElements - 1,
      })),
    };
  };
  
  /**
   * Находит уведомление и проверяет, непрочитано ли оно
   */
  export const findNotificationStatus = (
    data: NotificationsInfiniteData | undefined,
    id: string
  ): boolean => {
    if (!data) return false;
  
    for (const page of data.pages) {
      const notification = page.content.find((n) => n.id === id);
      if (notification) {
        return notification.status === 'UNREAD';
      }
    }
    return false;
  };
  
  // ===== Deduplication =====
  
  const processedIds = new Set<string>();
  const MAX_PROCESSED_IDS = 200;
  
  /**
   * Помечает ID как обработанный, возвращает false если уже был обработан
   */
  export const markAsProcessed = (id: string): boolean => {
    if (processedIds.has(id)) {
      return false;
    }
  
    processedIds.add(id);
  
    if (processedIds.size > MAX_PROCESSED_IDS) {
      const idsArray = Array.from(processedIds);
      const toRemove = idsArray.slice(0, -MAX_PROCESSED_IDS);
      toRemove.forEach((oldId) => processedIds.delete(oldId));
    }
  
    return true;
  };
  
  /**
   * Очищает все обработанные ID
   */
  export const clearProcessedIds = (): void => {
    processedIds.clear();
  };