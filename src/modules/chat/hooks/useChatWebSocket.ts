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
} from '../types/chat.types';

// ===== Helper Functions =====

const isMessageDuplicate = (
  pages: MessagesInfiniteData['pages'],
  message: MessageResponse
): boolean => {
  return pages.some(page => 
    page.content.some(m => {
      if (m.id === message.id) return true;
      
      if (!m.id.startsWith('temp-')) return false;
      if (m.senderId !== message.senderId) return false;

      if (message.type === 'IMAGE' && message.imageId) {
        return m.imageId === message.imageId;
      }
      
      if (message.type === 'TEXT') {
        return m.content === message.content &&
          Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 10000;
      }
      
      return false;
    })
  );
};

const replaceOptimisticMessage = (
  pages: MessagesInfiniteData['pages'],
  message: MessageResponse
): MessagesInfiniteData['pages'] => {
  return pages.map(page => ({
    ...page,
    content: page.content.map(m => {
      if (m.id === message.id) return message;
      
      if (!m.id.startsWith('temp-')) return m;
      if (m.senderId !== message.senderId) return m;
      
      if (message.type === 'IMAGE' && message.imageId && m.imageId === message.imageId) {
        return message;
      }
      
      if (message.type === 'TEXT' && m.content === message.content) {
        return message;
      }
      
      return m;
    }),
  }));
};

const addMessageToPages = (
  pages: MessagesInfiniteData['pages'],
  message: MessageResponse
): MessagesInfiniteData['pages'] => {
  const newPages = [...pages];
  const firstPage = newPages[0];
  
  if (firstPage) {
    newPages[0] = {
      ...firstPage,
      content: [message, ...firstPage.content],
      totalElements: firstPage.totalElements + 1,
    };
  }
  
  return newPages;
};

const createPagesWithNewMessage = (
  pages: MessagesInfiniteData['pages'],
  message: MessageResponse
): MessagesInfiniteData['pages'] => {
  if (isMessageDuplicate(pages, message)) {
    return replaceOptimisticMessage(pages, message);
  }
  
  return addMessageToPages(pages, message);
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
  }],
  pageParams: [0],
});

// ===== Main Hook =====

export const useChatWebSocket = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, userId } = useAuth();
  
  const setConnected = useChatStore((state) => state.setConnected);
  const setConnecting = useChatStore((state) => state.setConnecting);
  const setTypingUser = useChatStore((state) => state.setTypingUser);
  const incrementTotalUnread = useChatStore((state) => state.incrementTotalUnread);
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);
  
  const selectedChatIdRef = useRef(selectedChatId);
  const isConnectedRef = useRef(isConnected);
  const userIdRef = useRef(userId);
  
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // ===== NEW MESSAGE HANDLER =====
  const handleNewMessage = useCallback((wsMessage: WsOutgoingMessage) => {
    const message = wsMessage.message;
    if (!message) return;

    const chatId = message.chatId;
    const currentUserId = userIdRef.current;
    const isOwnMessage = message.senderId === currentUserId;
    const isCurrentChat = selectedChatIdRef.current === chatId;

    // 1. Обновляем сообщения в кэше
    queryClient.setQueryData<MessagesInfiniteData>(
      queryKeys.chats.messagesInfinite(chatId),
      (old) => {
        if (!old) {
          return createInitialMessagesData(message);
        }
        return {
          ...old,
          pages: createPagesWithNewMessage(old.pages, message),
        };
      }
    );

    // 2. Проверяем, существует ли чат в списке
    const existingChats = queryClient.getQueryData<ChatResponse[]>(queryKeys.chats.lists());
    const existingChat = existingChats?.find(chat => chat.id === chatId);
    
    // 3. Определяем, нужно ли увеличивать счётчик
    const shouldIncrementUnread = !isOwnMessage && !isCurrentChat;

    if (existingChat) {
      // Чат существует - обновляем локально
      queryClient.setQueryData<ChatResponse[]>(
        queryKeys.chats.lists(),
        (old) => {
          if (!old) return old;
          
          return old.map((chat) => {
            if (chat.id !== chatId) return chat;
            
            return {
              ...chat,
              lastMessage: message.type === 'TEXT' ? message.content : null,
              lastMessageTime: message.createdAt,
              lastMessageType: message.type,
              lastMessageImageId: message.imageId,
              unreadCount: shouldIncrementUnread 
                ? (chat.unreadCount || 0) + 1 
                : chat.unreadCount,
            };
          });
        }
      );

      // Увеличиваем общий счётчик только если обновили локально
      if (shouldIncrementUnread) {
        incrementTotalUnread();
      }
    } else {
      // Чат не существует в кэше - это новый чат!
      // Инвалидируем список - сервер вернёт с правильным unreadCount
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
      
      // НЕ вызываем incrementTotalUnread здесь - 
      // useTotalUnread пересчитает из нового списка
    }
  }, [queryClient, incrementTotalUnread]);

  // ===== MESSAGES READ HANDLER =====
  const handleMessagesRead = useCallback((wsMessage: WsOutgoingMessage) => {
    const chatId = wsMessage.chatId;
    if (!chatId) return;

    // Обновляем статус сообщений на READ
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

    // Также обновляем isOnline в списке чатов
    queryClient.setQueryData<ChatResponse[]>(
      queryKeys.chats.lists(),
      (old) => {
        if (!old) return old;
        
        return old.map((chat) => {
          if (chat.recipientId !== presenceUserId) return chat;
          
          return {
            ...chat,
            isOnline,
          };
        });
      }
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
    
    // При переподключении обновляем список чатов
    if (connected) {
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
    }
  }, [isAuthenticated, setConnected]);

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