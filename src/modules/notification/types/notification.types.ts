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
  | 'USER_FOLLOWED'
  | 'USER_MENTIONED';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

// ===== API Response Types =====

export interface NotificationResponse {
  id: string;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  status: NotificationStatus;
  referenceId: string | null;
  secondaryRefId: string | null;
  previewText: string | null;
  previewImageId: string | null;
  createdAt: string;
  readAt: string | null;
}

export type PageNotificationResponse = PageResponse<NotificationResponse>;

// ===== Extended Types =====

export interface NotificationWithActor extends NotificationResponse {
  actor?: {
    id: string;
    username: string;
    imageId: string | null;
  };
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