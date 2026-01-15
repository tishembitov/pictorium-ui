// src/modules/notification/index.ts

// Types
export type {
  NotificationType,
  NotificationStatus,
  NotificationResponse,
  PageNotificationResponse,
  NotificationWithActors,
  NotificationState,
  NotificationActions,
  MarkAsReadResponse,
  UnreadCountResponse,
  SSEEventType,
  SSEEvent,
} from './types/notification.types';

// API
export { notificationApi } from './api/notificationApi';

// Services
export { notificationSSEService } from './services/sseService';

// Store
export {
  useNotificationStore,
  selectUnreadCount,
  selectIsConnected,
  selectIsConnecting,
} from './stores/notificationStore';

// Hooks
export { useNotifications } from './hooks/useNotifications';
export { useUnreadCount, useUnreadCountValue } from './hooks/useUnreadCount';
export { useMarkAsRead, useMarkAllAsRead } from './hooks/useMarkAsRead';
export { useDeleteNotification } from './hooks/useDeleteNotification';
export { useNotificationSSE } from './hooks/useNotificationSSE';
export { useNotificationItemLocalState } from './hooks/useNotificationItemLocalState';
export { useNotificationActors } from './hooks/useNotificationActors';
export type { NotificationItemLocalState } from './hooks/useNotificationItemLocalState';

// Components
export { NotificationBadge } from './components/NotificationBadge';
export { NotificationBell } from './components/NotificationBell';
export { NotificationItem } from './components/NotificationItem';
export { NotificationList } from './components/NotificationList';
export { NotificationDropdown } from './components/NotificationDropdown';
export { NotificationPopup } from './components/NotificationPopup';
export { NotificationPopupManager } from './components/NotificationPopupManager';

// Utils
export {
  upsertNotification,
  updateNotification,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  removeNotificationFromCache,
  findNotificationStatus,
  findNotificationInPages,
  notificationExistsInPages,
  countUnreadInIds,
  markAsProcessed,
  clearProcessedIds,
  isProcessed,
} from './utils/cacheHelpers';

export {
  getNotificationConfig,
  formatNotificationText,
} from './utils/formatNotification';