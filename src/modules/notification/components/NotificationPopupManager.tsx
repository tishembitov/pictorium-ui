// src/modules/notification/components/NotificationPopupManager.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { NotificationPopup } from './NotificationPopup';
import { notificationSSEService } from '../services/sseService';
import { useAuth } from '@/modules/auth';
import { userApi } from '@/modules/user';
import { useChatStore } from '@/modules/chat'; // ✅ Добавлен импорт
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

// Actor cache to avoid repeated requests
const actorCache = new Map<string, {
  username: string;
  imageId: string | null;
  timestamp: number;
}>();
const ACTOR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
  
  // ✅ Получаем ID выбранного чата
  const selectedChatId = useChatStore((state) => state.selectedChatId);

  const removePopup = useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addPopup = useCallback(async (notification: NotificationResponse) => {
    // ✅ Для NEW_MESSAGE - показываем только если этот чат НЕ открыт
    if (notification.type === 'NEW_MESSAGE') {
      // referenceId для NEW_MESSAGE - это chatId
      const chatId = notification.referenceId;
      
      // Если этот чат сейчас открыт - не показываем popup
      if (chatId && chatId === selectedChatId) {
        return;
      }
    }

    let actorName = 'Someone';
    let actorUsername: string | undefined;
    let actorImageId: string | null = null;

    if (notification.actorId) {
      // Check cache first
      const cached = getCachedActor(notification.actorId);
      if (cached) {
        actorName = cached.username;
        actorUsername = cached.username;
        actorImageId = cached.imageId;
      } else {
        // Fetch actor info
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

    const popupItem: PopupItem = {
      id: notification.id,
      notification,
      actorName,
      actorUsername,
      actorImageId,
    };

    setPopups((prev) => {
      // Check for duplicates
      if (prev.some((p) => p.id === notification.id)) {
        return prev;
      }
      // Limit max popups, add new one at the beginning
      return [popupItem, ...prev].slice(0, MAX_POPUPS);
    });
  }, [selectedChatId]); // ✅ Добавлена зависимость

  // Subscribe to SSE notifications + cleanup on logout
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear cache when not authenticated
      actorCache.clear();
      return;
    }

    const unsubscribe = notificationSSEService.onNotification((notification) => {
      if (notification.status === 'UNREAD') {
        addPopup(notification);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, addPopup]);

  // Don't render if not authenticated or no popups
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