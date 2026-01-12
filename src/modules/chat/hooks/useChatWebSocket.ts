// src/modules/chat/hooks/useChatWebSocket.ts

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth';
import { queryKeys } from '@/app/config/queryClient';
import { useChatStore } from '../stores/chatStore';
import { websocketService } from '../services/websocketService';
import type {
  WsOutgoingMessage, 
  MessageResponse, 
  ChatResponse,
  MessagesInfiniteData,
  MessageState,
  UserPresence,
  PageMessageResponse,
} from '../types/chat.types';

// ===== Helper Functions =====

const isMessageMatch = (existing: MessageResponse, incoming: MessageResponse): boolean => {
  if (existing.id === incoming.id) return true;
  
  if (existing.id.startsWith('temp-') && existing.senderId === incoming.senderId) {
    if (incoming.type === 'IMAGE' && incoming.imageId) {
      return existing.imageId === incoming.imageId;
    }
    
    if (incoming.type === 'TEXT' && existing.content === incoming.content) {
      const timeDiff = Math.abs(
        new Date(existing.createdAt).getTime() - new Date(incoming.createdAt).getTime()
      );
      return timeDiff < 30000;
    }
  }
  
  return false;
};

const tryReplaceMessage = (
  pages: MessagesInfiniteData['pages'],
  message: MessageResponse
): MessagesInfiniteData['pages'] | null => {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (!page) continue;
    
    const existingIndex = page.content.findIndex(m => isMessageMatch(m, message));
    
    if (existingIndex !== -1) {
      const newPages = pages.map((p, idx) => {
        if (idx !== i) return p;
        return {
          ...p,
          content: p.content.map((m, mIdx) => 
            mIdx === existingIndex ? message : m
          ),
        };
      });
      return newPages;
    }
  }
  
  return null;
};

const addNewMessage = (
  pages: MessagesInfiniteData['pages'],
  message: MessageResponse
): MessagesInfiniteData['pages'] => {
  const firstPage = pages[0];
  if (!firstPage) return pages;
  
  return [
    {
      ...firstPage,
      content: [message, ...firstPage.content],
      totalElements: firstPage.totalElements + 1,
    },
    ...pages.slice(1),
  ];
};

const upsertMessage = (
  pages: MessagesInfiniteData['pages'],
  message: MessageResponse
): MessagesInfiniteData['pages'] => {
  const replacedPages = tryReplaceMessage(pages, message);
  if (replacedPages) {
    return replacedPages;
  }
  
  return addNewMessage(pages, message);
};

const createPagesWithUpdatedState = (
  pages: MessagesInfiniteData['pages'],
  newState: MessageState
): MessagesInfiniteData['pages'] => {
  return pages.map((page) => ({
    ...page,
    content: page.content.map((msg): MessageResponse => ({
      ...msg,
      state: newState,
    })),
  }));
};

const createInitialMessagesData = (message: MessageResponse): MessagesInfiniteData => ({
  pages: [{
    content: [message],
    totalElements: 1,
    totalPages: 1,
    size: 50,
    number: 0,
    first: true,
    last: true,
    empty: false,
  } as PageMessageResponse],
  pageParams: [0],
});

const processedMessageIds = new Set<string>();

const markMessageAsProcessed = (messageId: string): boolean => {
  if (processedMessageIds.has(messageId)) {
    return false;
  }
  processedMessageIds.add(messageId);
  
  if (processedMessageIds.size > 200) {
    const idsArray = Array.from(processedMessageIds);
    const toRemove = idsArray.slice(0, -200);
    toRemove.forEach(id => processedMessageIds.delete(id));
  }
  
  return true;
};

// ===== Main Hook =====

export const useChatWebSocket = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, userId } = useAuth();
  
  const setConnected = useChatStore((state) => state.setConnected);
  const setConnecting = useChatStore((state) => state.setConnecting);
  const setTypingUser = useChatStore((state) => state.setTypingUser);
  const incrementTotalUnread = useChatStore((state) => state.incrementTotalUnread);
  const decrementTotalUnread = useChatStore((state) => state.decrementTotalUnread);
  const setTotalUnread = useChatStore((state) => state.setTotalUnread);
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);
  
  const selectedChatIdRef = useRef(selectedChatId);
  const isConnectedRef = useRef(isConnected);
  const userIdRef = useRef(userId);
  const isPageVisibleRef = useRef(document.visibilityState === 'visible');
  const pendingMarkAsReadRef = useRef(false);
  
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // ===== MARK CHAT AS READ (helper) =====
  const markChatAsReadLocally = useCallback((chatId: string) => {
    const chats = queryClient.getQueryData<ChatResponse[]>(queryKeys.chats.lists());
    const chat = chats?.find(c => c.id === chatId);
    const unreadCount = chat?.unreadCount || 0;

    if (unreadCount === 0) return;

    queryClient.setQueryData<ChatResponse[]>(
      queryKeys.chats.lists(),
      (old) => {
        if (!old) return old;
        return old.map((c) => 
          c.id === chatId ? { ...c, unreadCount: 0 } : c
        );
      }
    );

    decrementTotalUnread(unreadCount);

    if (websocketService.isConnected) {
      websocketService.markAsRead(chatId);
    }
  }, [queryClient, decrementTotalUnread]);

  // ===== USER ACTIVITY HANDLER =====
  useEffect(() => {
    const handleUserActivity = () => {
      // Проверяем: есть ли выбранный чат и ожидается ли markAsRead
      if (!pendingMarkAsReadRef.current || !selectedChatIdRef.current) {
        return;
      }

      // Страница должна быть видимой
      if (!isPageVisibleRef.current) {
        return;
      }

      // Сбрасываем флаг и помечаем прочитанным
      pendingMarkAsReadRef.current = false;
      markChatAsReadLocally(selectedChatIdRef.current);
    };

    // Слушаем различные события активности
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [markChatAsReadLocally]);

  // ===== VISIBILITY CHANGE HANDLER =====
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = document.visibilityState === 'visible';
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ===== NEW MESSAGE HANDLER =====
  const handleNewMessage = useCallback((wsMessage: WsOutgoingMessage) => {
    const message = wsMessage.message;
    if (!message) return;

    const chatId = message.chatId;
    const messageId = message.id;
    const currentUserId = userIdRef.current;
    const isOwnMessage = message.senderId === currentUserId;
    const selectedChat = selectedChatIdRef.current;
    const isPageVisible = isPageVisibleRef.current;

    if (!markMessageAsProcessed(messageId)) {
      return;
    }

    const isChatSelected = selectedChat === chatId;
    const isChatActiveAndVisible = isChatSelected && isPageVisible;

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

    const shouldIncrementUnread = !isOwnMessage && !isChatActiveAndVisible;

    queryClient.setQueryData<ChatResponse[]>(
      queryKeys.chats.lists(),
      (old) => {
        if (!old) return old;
        
        const chatExists = old.some(chat => chat.id === chatId);
        
        if (!chatExists) {
          queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
          return old;
        }
        
        return old.map((chat) => {
          if (chat.id !== chatId) return chat;
          
          let newUnreadCount: number;
          if (isChatActiveAndVisible) {
            newUnreadCount = 0;
          } else if (shouldIncrementUnread) {
            newUnreadCount = (chat.unreadCount || 0) + 1;
          } else {
            newUnreadCount = chat.unreadCount;
          }
          
          return {
            ...chat,
            lastMessage: message.type === 'TEXT' ? message.content : null,
            lastMessageTime: message.createdAt,
            lastMessageType: message.type,
            lastMessageImageId: message.imageId,
            unreadCount: newUnreadCount,
          };
        });
      }
    );

    if (shouldIncrementUnread) {
      incrementTotalUnread();
      
      // Если чат выбран, но страница не видна - ставим флаг для последующего сброса
      if (isChatSelected && !isPageVisible) {
        pendingMarkAsReadRef.current = true;
      }
    }
    
    if (isChatActiveAndVisible && !isOwnMessage) {
      setTimeout(() => {
        websocketService.markAsRead(chatId);
      }, 500);
    }
  }, [queryClient, incrementTotalUnread]);

  // ===== MESSAGES READ HANDLER =====
  const handleMessagesRead = useCallback((wsMessage: WsOutgoingMessage) => {
    const chatId = wsMessage.chatId;
    if (!chatId) return;

    queryClient.setQueryData<MessagesInfiniteData>(
      queryKeys.chats.messagesInfinite(chatId),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: createPagesWithUpdatedState(old.pages, 'READ'),
        };
      }
    );
  }, [queryClient]);

  // ===== TYPING HANDLERS =====
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleTyping = useCallback((wsMessage: WsOutgoingMessage, isTyping: boolean) => {
    const { chatId, userId: typingUserId } = wsMessage;
    
    if (!chatId || !typingUserId) return;
    
    const timeoutKey = `${chatId}:${typingUserId}`;
    
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
  }, [setTypingUser]);

  useEffect(() => {
    const timeouts = typingTimeoutsRef.current;
    
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);
    
  // ===== PRESENCE HANDLER =====
  const handlePresence = useCallback((wsMessage: WsOutgoingMessage) => {
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
  }, [queryClient]);

  // ===== MAIN MESSAGE HANDLER =====
  const handleMessage = useCallback((wsMessage: WsOutgoingMessage) => {
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
        
      case 'ERROR':
        break;
        
      default:
        break;
    }
  }, [handleNewMessage, handleMessagesRead, handleTyping, handlePresence]);

  // ===== CONNECTION HANDLER =====
  const handleConnectionChange = useCallback((connected: boolean) => {
    setConnected(connected);
    setConnecting(false);
    
    if (connected) {
      processedMessageIds.clear();
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    }
  }, [setConnected, setConnecting, queryClient]);

  // ===== CONNECT ON MOUNT =====
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

  // ===== CLEANUP ON LOGOUT =====
  useEffect(() => {
    if (!isAuthenticated) {
      websocketService.disconnect();
      setConnected(false);
      setTotalUnread(0);
      processedMessageIds.clear();
      pendingMarkAsReadRef.current = false;
    }
  }, [isAuthenticated, setConnected, setTotalUnread]);

  // ===== JOIN/LEAVE CHAT =====
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

  // ===== PUBLIC API =====
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