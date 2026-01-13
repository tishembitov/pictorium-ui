// src/modules/notification/api/notificationApi.ts

import { get, patch, del } from '@/shared/api/apiClient';
import { NOTIFICATION_ENDPOINTS } from '@/shared/api/apiEndpoints';
import { createPaginationParams } from '@/shared/api/apiTypes';
import type { Pageable } from '@/shared/types/pageable.types';
import type { 
  PageNotificationResponse, 
  MarkAsReadResponse,
  UnreadCountResponse,
} from '../types/notification.types';

export const notificationApi = {
  /**
   * Get all notifications (paginated)
   */
  getNotifications: (pageable: Pageable = {}) => {
    return get<PageNotificationResponse>(NOTIFICATION_ENDPOINTS.list(), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Get unread notifications (paginated)
   */
  getUnreadNotifications: (pageable: Pageable = {}) => {
    return get<PageNotificationResponse>(NOTIFICATION_ENDPOINTS.unread(), {
      params: createPaginationParams(pageable),
    });
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: () => {
    return get<UnreadCountResponse>(NOTIFICATION_ENDPOINTS.unreadCount());
  },

  /**
   * Mark specific notifications as read
   */
  markAsRead: (ids: string[]) => {
    return patch<MarkAsReadResponse>(NOTIFICATION_ENDPOINTS.markAsRead(), ids);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: () => {
    return patch<MarkAsReadResponse>(NOTIFICATION_ENDPOINTS.markAllAsRead());
  },

  /**
   * Delete a notification
   */
  deleteNotification: (id: string) => {
    return del<void>(NOTIFICATION_ENDPOINTS.delete(id));
  },
};

export default notificationApi;