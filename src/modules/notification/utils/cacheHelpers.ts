// src/modules/notification/utils/cacheHelpers.ts

import type {
  NotificationResponse,
  PageNotificationResponse,
} from '../types/notification.types';
import type { InfiniteData } from '@tanstack/react-query';

type NotificationsInfiniteData = InfiniteData<PageNotificationResponse>;

// ===== Notification Helpers =====

/**
 * Находит уведомление по ID в страницах
 */
export const findNotificationInPages = (
  pages: NotificationsInfiniteData['pages'],
  notificationId: string
): NotificationResponse | undefined => {
  for (const page of pages) {
    const found = page.content.find((n) => n.id === notificationId);
    if (found) return found;
  }
  return undefined;
};

/**
 * Проверяет, существует ли уведомление в страницах
 */
export const notificationExistsInPages = (
  pages: NotificationsInfiniteData['pages'],
  notificationId: string
): boolean => {
  return findNotificationInPages(pages, notificationId) !== undefined;
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
 * Обновляет существующее уведомление в страницах
 */
export const updateNotificationInPages = (
  pages: NotificationsInfiniteData['pages'],
  notification: NotificationResponse
): NotificationsInfiniteData['pages'] => {
  return pages.map((page) => ({
    ...page,
    content: page.content.map((n) =>
      n.id === notification.id ? notification : n
    ),
  }));
};

/**
 * Перемещает уведомление в начало (при обновлении агрегации)
 */
export const moveNotificationToTop = (
  pages: NotificationsInfiniteData['pages'],
  notification: NotificationResponse
): NotificationsInfiniteData['pages'] => {
  // Удаляем из текущей позиции
  const pagesWithoutNotification = pages.map((page) => ({
    ...page,
    content: page.content.filter((n) => n.id !== notification.id),
  }));

  // Добавляем в начало
  return addNotificationToFirstPage(pagesWithoutNotification, notification);
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
 * Добавляет новое уведомление (upsert)
 */
export const upsertNotification = (
  old: NotificationsInfiniteData | undefined,
  notification: NotificationResponse
): NotificationsInfiniteData => {
  if (!old) {
    return createInitialNotificationsData(notification);
  }

  if (notificationExistsInPages(old.pages, notification.id)) {
    // Уведомление существует - это не должно происходить для 'notification' события
    return old;
  }

  return {
    ...old,
    pages: addNotificationToFirstPage(old.pages, notification),
  };
};

/**
 * Обновляет существующее уведомление (для агрегации)
 */
export const updateNotification = (
  old: NotificationsInfiniteData | undefined,
  notification: NotificationResponse
): NotificationsInfiniteData => {
  if (!old) {
    return createInitialNotificationsData(notification);
  }

  if (!notificationExistsInPages(old.pages, notification.id)) {
    // Уведомление не найдено - добавляем как новое
    return {
      ...old,
      pages: addNotificationToFirstPage(old.pages, notification),
    };
  }

  // Обновляем и перемещаем в начало (т.к. updatedAt изменился)
  return {
    ...old,
    pages: moveNotificationToTop(old.pages, notification),
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

  const notification = findNotificationInPages(data.pages, id);
  return notification?.status === 'UNREAD';
};

// ===== Deduplication =====

const processedIds = new Map<string, number>(); // id -> updatedAt timestamp
const MAX_PROCESSED_IDS = 200;

/**
 * Помечает ID как обработанный, возвращает false если уже был обработан с той же версией
 */
export const markAsProcessed = (id: string, updatedAt?: string): boolean => {
  const timestamp = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  const existingTimestamp = processedIds.get(id);

  // Если уже обработан с той же или более новой версией - пропускаем
  if (existingTimestamp !== undefined && existingTimestamp >= timestamp) {
    return false;
  }

  processedIds.set(id, timestamp);

  // Очистка старых записей
  if (processedIds.size > MAX_PROCESSED_IDS) {
    const entries = Array.from(processedIds.entries());
    entries
      .sort((a, b) => a[1] - b[1])
      .slice(0, processedIds.size - MAX_PROCESSED_IDS)
      .forEach(([oldId]) => processedIds.delete(oldId));
  }

  return true;
};

/**
 * Очищает все обработанные ID
 */
export const clearProcessedIds = (): void => {
  processedIds.clear();
};