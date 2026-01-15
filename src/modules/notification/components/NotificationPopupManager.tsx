// src/modules/notification/components/NotificationPopupManager.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { NotificationPopup } from './NotificationPopup';
import { notificationSSEService } from '../services/sseService';
import { useAuth } from '@/modules/auth';
import { userApi } from '@/modules/user';
import { useChatStore } from '@/modules/chat';
import type { NotificationResponse } from '../types/notification.types';

interface PopupItem {
  id: string;
  notification: NotificationResponse;
  actorName: string;
  actorUsername?: string;
  actorImageId?: string | null;
}

const MAX_POPUPS = 3;
const POPUP_DURATION = 5000;

// Actor cache
const actorCache = new Map<
  string,
  {
    username: string;
    imageId: string | null;
    timestamp: number;
  }
>();
const ACTOR_CACHE_TTL = 5 * 60 * 1000;

const getCachedActor = (actorId: string) => {
  const cached = actorCache.get(actorId);
  if (cached && Date.now() - cached.timestamp < ACTOR_CACHE_TTL) {
    return cached;
  }
  return null;
};

const setCachedActor = (
  actorId: string,
  username: string,
  imageId: string | null
): void => {
  actorCache.set(actorId, { username, imageId, timestamp: Date.now() });
};

export const NotificationPopupManager: React.FC = () => {
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const { isAuthenticated } = useAuth();
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  const selectedChatIdRef = useRef(selectedChatId);

  // Обновляем ref при изменении
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  const removePopup = useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addPopup = useCallback(async (notification: NotificationResponse) => {
    // Для NEW_MESSAGE - показываем только если чат НЕ открыт
    if (notification.type === 'NEW_MESSAGE') {
      const chatId = notification.referenceId;
      if (chatId && chatId === selectedChatIdRef.current) {
        return;
      }
    }

    let actorName = 'Someone';
    let actorUsername: string | undefined;
    let actorImageId: string | null = null;

    if (notification.actorId) {
      const cached = getCachedActor(notification.actorId);
      if (cached) {
        actorName = cached.username;
        actorUsername = cached.username;
        actorImageId = cached.imageId;
      } else {
        try {
          const actor = await userApi.getById(notification.actorId);
          actorName = actor.username || 'Someone';
          actorUsername = actor.username;
          actorImageId = actor.imageId || null;
          setCachedActor(notification.actorId, actorName, actorImageId);
        } catch {
          // Use default
        }
      }
    }

    // Форматируем имя с учётом агрегации
    let displayName = actorName;
    if (notification.uniqueActorCount > 1) {
      const othersCount = notification.uniqueActorCount - 1;
      displayName =
        othersCount === 1
          ? `${actorName} and 1 other`
          : `${actorName} and ${othersCount} others`;
    }

    const popupItem: PopupItem = {
      id: notification.id,
      notification,
      actorName: displayName,
      actorUsername,
      actorImageId,
    };

    setPopups((prev) => {
      // Для обновлений - заменяем существующий popup
      const existingIndex = prev.findIndex((p) => p.id === notification.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = popupItem;
        return updated;
      }

      // Новый popup
      return [popupItem, ...prev].slice(0, MAX_POPUPS);
    });
  }, []);

  // Subscribe to SSE notifications
  useEffect(() => {
    if (!isAuthenticated) {
      actorCache.clear();
      return;
    }

    const unsubscribe = notificationSSEService.onNotification(
      (notification) => {
        // Показываем popup и для новых, и для обновлённых UNREAD уведомлений
        if (notification.status === 'UNREAD') {
          addPopup(notification);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, addPopup]);

  if (!isAuthenticated || popups.length === 0) {
    return null;
  }

  return (
    <>
      {popups.map((popup, index) => (
        <NotificationPopup
          key={popup.id}
          notification={popup.notification}
          actorName={popup.actorName}
          actorUsername={popup.actorUsername}
          actorImageId={popup.actorImageId}
          onClose={() => removePopup(popup.id)}
          duration={POPUP_DURATION}
          index={index}
        />
      ))}
    </>
  );
};

export default NotificationPopupManager;