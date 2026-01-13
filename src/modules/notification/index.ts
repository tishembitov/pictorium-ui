// src/modules/notification/index.ts

// Types
export type {
    NotificationType,
    NotificationStatus,
    NotificationResponse,
    PageNotificationResponse,
    NotificationWithActor,
    SSENotificationEvent,
    NotificationState,
    NotificationActions,
    MarkAsReadResponse,
    UnreadCountResponse,
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
  
  // Components
  export { NotificationBadge } from './components/NotificationBadge';
  export { NotificationBell } from './components/NotificationBell';
  export { NotificationItem } from './components/NotificationItem';
  export { NotificationList } from './components/NotificationList';
  export { NotificationDropdown } from './components/NotificationDropdown';