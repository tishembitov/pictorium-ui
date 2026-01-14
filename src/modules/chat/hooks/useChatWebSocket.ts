// src/modules/chat/hooks/useChatWebSocket.ts

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth';
import { queryKeys } from '@/app/config/queryClient';
import { useChatStore } from '../stores/chatStore';
import { websocketService } from '../services/websocketService';
import {
  upsertMessage,
  updateMessagesState,
  createInitialMessagesData,
  updateChatInList,
  updateChatUnreadCount,
  incrementChatUnread,
  chatExistsInList,
  markAsProcessed,
  clearProcessedIds,
} from '../utils/cacheHelpers';
import type {
  WsOutgoingMessage,
  MessageResponse,
  ChatResponse,
  MessagesInfiniteData,
  UserPresence,
} from '../types/chat.types';

export const useChatWebSocket = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, userId } = useAuth();

  // Store actions
  const setConnected = useChatStore((state) => state.setConnected);
  const setConnecting = useChatStore((state) => state.setConnecting);
  const setTypingUser = useChatStore((state) => state.setTypingUser);
  const incrementTotalUnread = useChatStore((state) => state.incrementTotalUnread);
  const decrementTotalUnread = useChatStore((state) => state.decrementTotalUnread);
  const setTotalUnread = useChatStore((state) => state.setTotalUnread);

  // Store state
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);

  // Refs для доступа в callbacks
  const selectedChatIdRef = useRef(selectedChatId);
  const isConnectedRef = useRef(isConnected);
  const userIdRef = useRef(userId);
  const isPageVisibleRef = useRef(document.visibilityState === 'visible');
  const pendingMarkAsReadRef = useRef(false);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Sync refs
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // ===== Cache Update Helpers =====

  const updateMessagesCache = useCallback(
    (chatId: string, message: MessageResponse) => {
      queryClient.setQueryData<MessagesInfiniteData>(
        queryKeys.chats.messagesInfinite(chatId),
        (old) => {
          if (!old) {
            return createInitialMessagesData(message);
          }
          return {
            ...old,
            pages: upsertMessage(old.pages, message),
          };
        }
      );
    },
    [queryClient]
  );

  const updateChatsCache = useCallback(
    (message: MessageResponse, shouldIncrementUnread: boolean) => {
      queryClient.setQueryData<ChatResponse[]>(
        queryKeys.chats.lists(),
        (old) => {
          if (!old) return old;

          if (!chatExistsInList(old, message.chatId)) {
            // Новый чат - инвалидируем список
            queryClient.invalidateQueries({ 
              queryKey: queryKeys.chats.lists(),
              refetchType: 'none',
            });
            return old;
          }

          let updated = updateChatInList(old, {
            chatId: message.chatId,
            lastMessage: message.type === 'TEXT' ? message.content : null,
            lastMessageTime: message.createdAt,
            lastMessageType: message.type,
            lastMessageImageId: message.imageId,
          });

          if (shouldIncrementUnread) {
            updated = incrementChatUnread(updated, message.chatId);
          } else if (selectedChatIdRef.current === message.chatId && isPageVisibleRef.current) {
            updated = updateChatUnreadCount(updated, message.chatId, 0);
          }

          return updated;
        }
      );
    },
    [queryClient]
  );

  const markChatAsReadLocally = useCallback(
    (chatId: string) => {
      const chats = queryClient.getQueryData<ChatResponse[]>(queryKeys.chats.lists());
      const chat = chats?.find((c) => c.id === chatId);
      const unreadCount = chat?.unreadCount || 0;

      if (unreadCount === 0) return;

      queryClient.setQueryData<ChatResponse[]>(
        queryKeys.chats.lists(),
        (old) => (old ? updateChatUnreadCount(old, chatId, 0) : old)
      );

      decrementTotalUnread(unreadCount);

      if (websocketService.isConnected) {
        websocketService.markAsRead(chatId);
      }
    },
    [queryClient, decrementTotalUnread]
  );

  // ===== Message Handlers =====

  const handleNewMessage = useCallback(
    (wsMessage: WsOutgoingMessage) => {
      const message = wsMessage.message;
      if (!message) return;

      if (!markAsProcessed(message.id)) {
        return;
      }

      const chatId = message.chatId;
      const currentUserId = userIdRef.current;
      const isOwnMessage = message.senderId === currentUserId;
      const isChatSelected = selectedChatIdRef.current === chatId;
      const isPageVisible = isPageVisibleRef.current;
      const isChatActiveAndVisible = isChatSelected && isPageVisible;
      const shouldIncrementUnread = !isOwnMessage && !isChatActiveAndVisible;

      // Update messages cache
      updateMessagesCache(chatId, message);

      // Update chats list
      updateChatsCache(message, shouldIncrementUnread);

      // Update unread counter
      if (shouldIncrementUnread) {
        incrementTotalUnread();

        if (isChatSelected && !isPageVisible) {
          pendingMarkAsReadRef.current = true;
        }
      }

      // Mark as read if chat is active
      if (isChatActiveAndVisible && !isOwnMessage) {
        setTimeout(() => {
          websocketService.markAsRead(chatId);
        }, 500);
      }
    },
    [updateMessagesCache, updateChatsCache, incrementTotalUnread]
  );

  const handleMessagesRead = useCallback(
    (wsMessage: WsOutgoingMessage) => {
      const chatId = wsMessage.chatId;
      if (!chatId) return;

      queryClient.setQueryData<MessagesInfiniteData>(
        queryKeys.chats.messagesInfinite(chatId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: updateMessagesState(old.pages, 'READ'),
          };
        }
      );
    },
    [queryClient]
  );

  const handleTyping = useCallback(
    (wsMessage: WsOutgoingMessage, isTyping: boolean) => {
      const { chatId, userId: typingUserId } = wsMessage;
      if (!chatId || !typingUserId) return;

      const timeoutKey = `${chatId}:${typingUserId}`;

      // Clear existing timeout
      const existingTimeout = typingTimeoutsRef.current.get(timeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeoutsRef.current.delete(timeoutKey);
      }

      if (isTyping) {
        setTypingUser(chatId, typingUserId, true);

        const timeout = setTimeout(() => {
          setTypingUser(chatId, typingUserId, false);
          typingTimeoutsRef.current.delete(timeoutKey);
        }, 3000);

        typingTimeoutsRef.current.set(timeoutKey, timeout);
      } else {
        setTypingUser(chatId, typingUserId, false);
      }
    },
    [setTypingUser]
  );

  const handlePresence = useCallback(
    (wsMessage: WsOutgoingMessage) => {
      const { userId: presenceUserId, type } = wsMessage;
      if (!presenceUserId) return;

      const isOnline = type === 'USER_ONLINE';

      queryClient.setQueryData<UserPresence>(
        queryKeys.presence.byUser(presenceUserId),
        (): UserPresence => ({
          status: isOnline ? 'ONLINE' : 'RECENTLY',
          isOnline,
          lastSeen: isOnline ? null : new Date().toISOString(),
        })
      );
    },
    [queryClient]
  );

  // ===== Main Message Handler =====

  const handleMessage = useCallback(
    (wsMessage: WsOutgoingMessage) => {
      switch (wsMessage.type) {
        case 'NEW_MESSAGE':
          handleNewMessage(wsMessage);
          break;
        case 'MESSAGES_READ':
          handleMessagesRead(wsMessage);
          break;
        case 'USER_TYPING':
          handleTyping(wsMessage, true);
          break;
        case 'USER_STOPPED_TYPING':
          handleTyping(wsMessage, false);
          break;
        case 'USER_ONLINE':
        case 'USER_OFFLINE':
          handlePresence(wsMessage);
          break;
        default:
          break;
      }
    },
    [handleNewMessage, handleMessagesRead, handleTyping, handlePresence]
  );

  // ===== Connection Handler =====

  const handleConnectionChange = useCallback(
    (connected: boolean) => {
      setConnected(connected);
      setConnecting(false);

      if (connected) {
        clearProcessedIds();
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.chats.lists(),
          refetchType: 'none',
        });
      }
    },
    [setConnected, setConnecting, queryClient]
  );

  // ===== User Activity Handler =====

  useEffect(() => {
    const handleUserActivity = () => {
      if (!pendingMarkAsReadRef.current || !selectedChatIdRef.current) {
        return;
      }

      if (!isPageVisibleRef.current) {
        return;
      }

      pendingMarkAsReadRef.current = false;
      markChatAsReadLocally(selectedChatIdRef.current);
    };

    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [markChatAsReadLocally]);

  // ===== Visibility Handler =====

  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ===== Connect on Mount =====

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    setConnecting(true);
    websocketService.connect();

    const unsubMessage = websocketService.onMessage(handleMessage);
    const unsubConnection = websocketService.onConnectionChange(handleConnectionChange);

    return () => {
      unsubMessage();
      unsubConnection();
    };
  }, [isAuthenticated, handleMessage, handleConnectionChange, setConnecting]);

  // ===== Cleanup on Logout =====

  useEffect(() => {
    if (!isAuthenticated) {
      websocketService.disconnect();
      setConnected(false);
      setTotalUnread(0);
      clearProcessedIds();
      pendingMarkAsReadRef.current = false;
    }
  }, [isAuthenticated, setConnected, setTotalUnread]);

  // ===== Join/Leave Chat =====

  useEffect(() => {
    if (!selectedChatId || !isConnected) {
      return;
    }

    websocketService.joinChat(selectedChatId);

    return () => {
      if (isConnectedRef.current && selectedChatId) {
        websocketService.leaveChat(selectedChatId);
      }
    };
  }, [selectedChatId, isConnected]);

  // ===== Cleanup Typing Timeouts =====

  useEffect(() => {
    const timeouts = typingTimeoutsRef.current;

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  // ===== Public API =====

  const sendTyping = useCallback((chatId: string, typing: boolean) => {
    if (websocketService.isConnected) {
      websocketService.sendTyping(chatId, typing);
    }
  }, []);

  const markAsRead = useCallback((chatId: string) => {
    if (websocketService.isConnected) {
      websocketService.markAsRead(chatId);
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    sendTyping,
    markAsRead,
  };
};

export default useChatWebSocket;