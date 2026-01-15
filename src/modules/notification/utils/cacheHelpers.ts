// src/modules/notification/utils/cacheHelpers.ts

import type {
  NotificationResponse,
  PageNotificationResponse,
} from '../types/notification.types';
import type { InfiniteData } from '@tanstack/react-query';

type NotificationsInfiniteData = InfiniteData<PageNotificationResponse>;

// ===== Find Helpers =====

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
 * Находит индексы страницы и элемента для уведомления
 */
export const findNotificationIndices = (
  pages: NotificationsInfiniteData['pages'],
  notificationId: string
): { pageIndex: number; itemIndex: number } | null => {
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    if (!page) continue;
    
    const itemIndex = page.content.findIndex((n) => n.id === notificationId);
    if (itemIndex !== -1) {
      return { pageIndex, itemIndex };
    }
  }
  return null;
};

// ===== Modification Helpers =====

/**
 * Удаляет уведомление из страниц (без изменения totalElements)
 */
const removeNotificationFromPages = (
  pages: NotificationsInfiniteData['pages'],
  notificationId: string
): NotificationsInfiniteData['pages'] => {
  return pages.map((page) => ({
    ...page,
    content: page.content.filter((n) => n.id !== notificationId),
  }));
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
 * Заменяет уведомление на месте (без перемещения)
 */
const replaceNotificationInPlace = (
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
 * Перемещает уведомление в начало (для обновлённых уведомлений)
 */
export const moveNotificationToTop = (
  pages: NotificationsInfiniteData['pages'],
  notification: NotificationResponse
): NotificationsInfiniteData['pages'] => {
  // Удаляем из текущей позиции
  const pagesWithoutNotification = removeNotificationFromPages(pages, notification.id);
  
  // Добавляем в начало первой страницы (без увеличения totalElements, т.к. это перемещение)
  const firstPage = pagesWithoutNotification[0];
  if (!firstPage) return pagesWithoutNotification;

  return [
    {
      ...firstPage,
      content: [notification, ...firstPage.content],
      // totalElements НЕ увеличиваем - это перемещение, а не добавление
    },
    ...pagesWithoutNotification.slice(1),
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

// ===== Main Cache Operations =====

/**
 * Добавляет НОВОЕ уведомление в кэш
 * Используется для события 'notification'
 */
export const upsertNotification = (
  old: NotificationsInfiniteData | undefined,
  notification: NotificationResponse
): NotificationsInfiniteData => {
  if (!old) {
    return createInitialNotificationsData(notification);
  }

  // Проверяем дубль
  if (notificationExistsInPages(old.pages, notification.id)) {
    // Если уже есть - заменяем на месте (на случай если пришло раньше чем мы обработали)
    return {
      ...old,
      pages: replaceNotificationInPlace(old.pages, notification),
    };
  }

  // Добавляем в начало
  return {
    ...old,
    pages: addNotificationToFirstPage(old.pages, notification),
  };
};

/**
 * Обновляет СУЩЕСТВУЮЩЕЕ уведомление (агрегация)
 * Используется для события 'notification_updated'
 */
export const updateNotification = (
  old: NotificationsInfiniteData | undefined,
  notification: NotificationResponse
): NotificationsInfiniteData => {
  if (!old) {
    // Если нет данных - создаём как новое
    return createInitialNotificationsData(notification);
  }

  const exists = notificationExistsInPages(old.pages, notification.id);

  if (!exists) {
    // Уведомление не найдено - добавляем как новое
    // (может быть если кэш устарел)
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
  const idSet = new Set(ids);

  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      content: page.content.map((notification) =>
        idSet.has(notification.id)
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
      totalElements: page.content.some((n) => n.id === id)
        ? page.totalElements - 1
        : page.totalElements,
    })),
  };
};

/**
 * Находит уведомление и возвращает его статус
 */
export const findNotificationStatus = (
  data: NotificationsInfiniteData | undefined,
  id: string
): boolean => {
  if (!data) return false;

  const notification = findNotificationInPages(data.pages, id);
  return notification?.status === 'UNREAD';
};

/**
 * Получает количество UNREAD уведомлений, которые будут затронуты
 */
export const countUnreadInIds = (
  data: NotificationsInfiniteData | undefined,
  ids: string[]
): number => {
  if (!data) return 0;

  const idSet = new Set(ids);
  let count = 0;

  for (const page of data.pages) {
    for (const notification of page.content) {
      if (idSet.has(notification.id) && notification.status === 'UNREAD') {
        count++;
      }
    }
  }

  return count;
};

// ===== Deduplication =====

interface ProcessedEntry {
  updatedAt: number;
  processedAt: number;
}

const processedIds = new Map<string, ProcessedEntry>();
const MAX_PROCESSED_IDS = 200;
const STALE_THRESHOLD = 1000; // 1 секунда - если пришло раньше, чем мы обработали

/**
 * Помечает ID как обработанный, возвращает false если уже был обработан с той же или более новой версией
 */
export const markAsProcessed = (id: string, updatedAt?: string): boolean => {
  const now = Date.now();
  const timestamp = updatedAt ? new Date(updatedAt).getTime() : now;
  
  const existing = processedIds.get(id);

  // Если уже обработан с той же или более новой версией
  if (existing) {
    // Если updatedAt такой же или старее - пропускаем
    if (existing.updatedAt >= timestamp) {
      return false;
    }
    
    // Если обработали недавно и updatedAt немного новее - тоже пропускаем
    // (защита от дубликатов при быстрых обновлениях)
    if (now - existing.processedAt < STALE_THRESHOLD && 
        timestamp - existing.updatedAt < STALE_THRESHOLD) {
      return false;
    }
  }

  processedIds.set(id, { updatedAt: timestamp, processedAt: now });

      // Очистка старых записей
    // Очистка старых записей
    if (processedIds.size > MAX_PROCESSED_IDS) {
      const entries = Array.from(processedIds.entries());
      
      // Сортировка в отдельном выражении
      entries.sort((a, b) => a[1].processedAt - b[1].processedAt);
      
      entries
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

/**
 * Проверяет, обработан ли ID (без добавления)
 */
export const isProcessed = (id: string, updatedAt?: string): boolean => {
  const existing = processedIds.get(id);
  if (!existing) return false;
  
  if (!updatedAt) return true;
  
  const timestamp = new Date(updatedAt).getTime();
  return existing.updatedAt >= timestamp;
};