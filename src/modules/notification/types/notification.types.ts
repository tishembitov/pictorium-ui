// src/modules/notification/types/notification.types.ts

import type { PageResponse } from '@/shared/types/pageable.types';

// ===== Enums =====

export type NotificationType =
  | 'NEW_MESSAGE'
  | 'PIN_LIKED'
  | 'PIN_COMMENTED'
  | 'PIN_SAVED'
  | 'COMMENT_LIKED'
  | 'COMMENT_REPLIED'
  | 'USER_FOLLOWED';

export type NotificationStatus = 'UNREAD' | 'READ';

// ===== API Response Types =====

export interface NotificationResponse {
  id: string;
  recipientId: string;
  actorId: string;
  /** Список последних акторов (до 3) для отображения */
  recentActorIds: string[];
  type: NotificationType;
  status: NotificationStatus;
  /** Количество агрегированных событий */
  aggregatedCount: number;
  /** Количество уникальных акторов */
  uniqueActorCount: number;
  referenceId: string | null;
  secondaryRefId: string | null;
  previewText: string | null;
  previewImageId: string | null;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
}

export type PageNotificationResponse = PageResponse<NotificationResponse>;

// ===== SSE Event Types =====

export type SSEEventType = 
  | 'notification' 
  | 'notification_updated' 
  | 'heartbeat' 
  | 'connected' 
  | 'unread_update';

export interface SSEEvent {
  type: SSEEventType;
  data?: NotificationResponse | Record<string, unknown>;
  timestamp: string;
}

// ===== Extended Types =====

export interface NotificationWithActors extends NotificationResponse {
  actors?: Array<{
    id: string;
    username: string;
    imageId: string | null;
  }>;
}

// ===== Store Types =====

export interface NotificationState {
  unreadCount: number;
  isConnected: boolean;
  isConnecting: boolean;
  lastEventTime: number | null;
}

export interface NotificationActions {
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: (by?: number) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setLastEventTime: (time: number) => void;
  reset: () => void;
}

// ===== API Response Types =====

export interface MarkAsReadResponse {
  updated: number;
}

export interface UnreadCountResponse {
  count: number;
}