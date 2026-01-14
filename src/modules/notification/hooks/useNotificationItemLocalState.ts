// src/modules/notification/hooks/useNotificationItemLocalState.ts

import { useState, useCallback, useMemo } from 'react';
import type { NotificationResponse, NotificationStatus } from '../types/notification.types';

export interface NotificationItemLocalState {
  status: NotificationStatus;
  isDeleted: boolean;
}

export interface UseNotificationItemLocalStateResult {
  state: NotificationItemLocalState;
  markAsRead: () => void;
  markAsDeleted: () => void;
  resetOverride: () => void;
}

/**
 * Локальное состояние уведомления для оптимистичных обновлений UI.
 */
export const useNotificationItemLocalState = (
  notification: NotificationResponse | undefined
): UseNotificationItemLocalStateResult => {
  const [override, setOverride] = useState<Partial<NotificationItemLocalState>>({});

  const state: NotificationItemLocalState = useMemo(() => ({
    status: override.status ?? notification?.status ?? 'UNREAD',
    isDeleted: override.isDeleted ?? false,
  }), [override, notification?.status]);

  const markAsRead = useCallback(() => {
    setOverride((prev) => ({
      ...prev,
      status: 'READ',
    }));
  }, []);

  const markAsDeleted = useCallback(() => {
    setOverride((prev) => ({
      ...prev,
      isDeleted: true,
    }));
  }, []);

  const resetOverride = useCallback(() => {
    setOverride({});
  }, []);

  return useMemo(() => ({
    state,
    markAsRead,
    markAsDeleted,
    resetOverride,
  }), [state, markAsRead, markAsDeleted, resetOverride]);
};

export default useNotificationItemLocalState;