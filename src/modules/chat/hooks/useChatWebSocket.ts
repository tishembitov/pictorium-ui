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
  MessageType,
  UserPresence,
} from '../types/chat.types';

// ===== Helper functions =====

const isMessageDuplicate = (
  pages: MessagesInfiniteData['pages'],
  message: MessageResponse
): boolean => {
  return pages.some(page => 
    page.content.some(m => 
      m.id === message.id || 
      (m.id.startsWith('temp-') && 
       m.content === message.content && 
       m.senderId === message.senderId &&
       Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000)
    )
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
      // Заменяем временное сообщение на реальное
      if (m.id.startsWith('temp-') && 
          m.content === message.content && 
          m.senderId === message.senderId) {
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
  // Проверяем на дубликат
  if (isMessageDuplicate(pages, message)) {
    // Заменяем оптимистичное сообщение
    return replaceOptimisticMessage(pages, message);
  }
  
  // Добавляем новое сообщение
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

interface UpdateChatParams {
  chatId: string;
  content: string | null;
  timestamp: string;
  messageType: MessageType;
  imageId: string | null;
  incrementUnread: boolean;
}

const updateChatsWithNewMessage = (
  chats: ChatResponse[],
  params: UpdateChatParams
): ChatResponse[] => {
  const { chatId, content, timestamp, messageType, imageId, incrementUnread } = params;
  
  return chats.map((chat) => {
    if (chat.id === chatId) {
      return {
        ...chat,
        lastMessage: messageType === 'TEXT' ? content : null,
        lastMessageTime: timestamp,
        lastMessageType: messageType,
        lastMessageImageId: imageId,
        unreadCount: incrementUnread 
          ? (chat.unreadCount || 0) + 1 
          : chat.unreadCount,
      };
    }
    return chat;
  });
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
  
  // Store selectors
  const setConnected = useChatStore((state) => state.setConnected);
  const setConnecting = useChatStore((state) => state.setConnecting);
  const setTypingUser = useChatStore((state) => state.setTypingUser);
  const incrementTotalUnread = useChatStore((state) => state.incrementTotalUnread);
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);
  
  // Refs для актуальных значений в callbacks
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

  // Обработчик NEW_MESSAGE
  const handleNewMessage = useCallback((wsMessage: WsOutgoingMessage) => {
    const message = wsMessage.message;
    if (!message) {
      console.warn('[WS] NEW_MESSAGE without message payload');
      return;
    }

    const chatId = message.chatId;
    const currentUserId = userIdRef.current;
    const isOwnMessage = message.senderId === currentUserId;
    const isCurrentChat = selectedChatIdRef.current === chatId;

    console.log('[WS] NEW_MESSAGE:', { 
      messageId: message.id, 
      chatId, 
      isOwnMessage,
      isCurrentChat,
      content: message.content?.substring(0, 20),
    });

    // Обновляем сообщения в кэше
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

    // Определяем, нужно ли увеличивать счётчик непрочитанных
    const shouldIncrementUnread = !isOwnMessage && !isCurrentChat;
    
    // Обновляем список чатов
    queryClient.setQueryData<ChatResponse[]>(
      queryKeys.chats.lists(),
      (old) => {
        if (!old) return old;
        return updateChatsWithNewMessage(old, {
          chatId,
          content: message.content,
          timestamp: message.createdAt,
          messageType: message.type,
          imageId: message.imageId,
          incrementUnread: shouldIncrementUnread,
        });
      }
    );

    // Увеличиваем общий счётчик
    if (shouldIncrementUnread) {
      incrementTotalUnread();
    }
  }, [queryClient, incrementTotalUnread]);

  // Обработчик MESSAGES_READ
  const handleMessagesRead = useCallback((wsMessage: WsOutgoingMessage) => {
    const chatId = wsMessage.chatId;
    if (!chatId) {
      console.warn('[WS] MESSAGES_READ without chatId');
      return;
    }

    console.log('[WS] MESSAGES_READ:', { chatId, userId: wsMessage.userId });

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

  // Добавляем Map для tracking typing timeouts
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleTyping = useCallback((wsMessage: WsOutgoingMessage, isTyping: boolean) => {
    const { chatId, userId: typingUserId } = wsMessage;
    
    if (!chatId || !typingUserId) return;
    
    const timeoutKey = `${chatId}:${typingUserId}`;
    
    // Очищаем предыдущий timeout
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

    // Очистка при размонтировании
  useEffect(() => {
    const timeouts = typingTimeoutsRef.current;
    
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);
    
  // Обработчик PRESENCE
  const handlePresence = useCallback((wsMessage: WsOutgoingMessage) => {
    const { userId: presenceUserId, type } = wsMessage;
    if (!presenceUserId) return;
    
    const isOnline = type === 'USER_ONLINE';
    console.log('[WS] PRESENCE:', { userId: presenceUserId, isOnline });
    
    queryClient.setQueryData<UserPresence>(
      queryKeys.presence.byUser(presenceUserId),
      (): UserPresence => ({
        status: isOnline ? 'ONLINE' : 'RECENTLY',
        isOnline,
        lastSeen: isOnline ? null : new Date().toISOString(),
      })
    );
  }, [queryClient]);

  // Main message handler
  const handleMessage = useCallback((wsMessage: WsOutgoingMessage) => {
    console.log('[WS] Received:', wsMessage.type);

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
        console.error('[WS] Server error:', wsMessage.error);
        break;
        
      default:
        console.warn('[WS] Unknown message type:', wsMessage.type);
    }
  }, [handleNewMessage, handleMessagesRead, handleTyping, handlePresence]);

  // Handle connection status changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    console.log('[WS] Connection status:', connected);
    setConnected(connected);
    setConnecting(false);
  }, [setConnected, setConnecting]);

  // Connect on mount if authenticated
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

  // Cleanup on logout
  useEffect(() => {
    if (!isAuthenticated) {
      websocketService.disconnect();
      setConnected(false);
    }
  }, [isAuthenticated, setConnected]);

  // Join/Leave chat
  useEffect(() => {
    if (!selectedChatId || !isConnected) {
      return;
    }
    
    console.log('[WS] Joining chat:', selectedChatId);
    websocketService.joinChat(selectedChatId);
    
    return () => {
      if (isConnectedRef.current && selectedChatId) {
        console.log('[WS] Leaving chat:', selectedChatId);
        websocketService.leaveChat(selectedChatId);
      }
    };
  }, [selectedChatId, isConnected]);

  // Public API
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