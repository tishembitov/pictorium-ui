// src/modules/chat/hooks/useChatWebSocket.ts

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { useAuth } from '@/modules/auth';
import { useChatStore } from '../stores/chatStore';
import { websocketService } from '../services/websocketService';
import type { 
  WsOutgoingMessage, 
  MessageResponse, 
  ChatResponse,
  MessagesInfiniteData,
  MessageState,
} from '../types/chat.types';

// ===== Helper functions =====

const createPagesWithNewMessage = (
  pages: MessagesInfiniteData['pages'],
  message: MessageResponse
): MessagesInfiniteData['pages'] => {
  const newPages = [...pages];
  const firstPage = newPages[0];
  
  if (firstPage) {
    newPages[0] = {
      ...firstPage,
      content: [message, ...firstPage.content],
    };
  }
  
  return newPages;
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

const createChatsWithNewMessage = (
  chats: ChatResponse[],
  chatId: string,
  content: string | undefined,
  timestamp: string,
  isCurrentChat: boolean
): ChatResponse[] => {
  return chats.map((chat) => {
    if (chat.id === chatId) {
      return {
        ...chat,
        lastMessage: content || 'Attachment',
        lastMessageTime: timestamp,
        unreadCount: isCurrentChat 
          ? chat.unreadCount 
          : (chat.unreadCount || 0) + 1,
      };
    }
    return chat;
  });
};

// ===== Main Hook =====

export const useChatWebSocket = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  
  // ✅ Отдельные селекторы
  const setConnected = useChatStore((state) => state.setConnected);
  const setConnecting = useChatStore((state) => state.setConnecting);
  const setTypingUser = useChatStore((state) => state.setTypingUser);
  const incrementTotalUnread = useChatStore((state) => state.incrementTotalUnread);
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);
  
  const selectedChatIdRef = useRef(selectedChatId);
  const isConnectedRef = useRef(isConnected);
  
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // ✅ Обработчик NEW_MESSAGE
  const handleNewMessage = useCallback((wsMessage: WsOutgoingMessage) => {
    const message = wsMessage.message;
    if (!message) return;

    const chatId = message.chatId;

    queryClient.setQueryData<MessagesInfiniteData>(
      queryKeys.chats.messagesInfinite(chatId),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: createPagesWithNewMessage(old.pages, message),
        };
      }
    );

    const isCurrentChat = selectedChatIdRef.current === chatId;
    
    queryClient.setQueryData<ChatResponse[]>(
      queryKeys.chats.lists(),
      (old) => {
        if (!old) return old;
        return createChatsWithNewMessage(
          old,
          chatId,
          message.content ?? undefined,
          message.createdAt,
          isCurrentChat
        );
      }
    );

    if (!isCurrentChat) {
      incrementTotalUnread();
    }
  }, [queryClient, incrementTotalUnread]);

  // ✅ Обработчик MESSAGES_READ
  const handleMessagesRead = useCallback((wsMessage: WsOutgoingMessage) => {
    if (!wsMessage.chatId) return;

    queryClient.setQueryData<MessagesInfiniteData>(
      queryKeys.chats.messagesInfinite(wsMessage.chatId),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: createPagesWithUpdatedState(old.pages, 'READ'),
        };
      }
    );
  }, [queryClient]);

  // ✅ Обработчик TYPING
  const handleTyping = useCallback((wsMessage: WsOutgoingMessage, isTyping: boolean) => {
    if (!wsMessage.chatId || !wsMessage.userId) return;
    setTypingUser(wsMessage.chatId, wsMessage.userId, isTyping);
  }, [setTypingUser]);

  // ✅ Обработчик PRESENCE
  const handlePresence = useCallback((wsMessage: WsOutgoingMessage) => {
    if (!wsMessage.userId) return;
    
    queryClient.setQueryData(
      queryKeys.presence.byUser(wsMessage.userId),
      wsMessage.type === 'USER_ONLINE'
    );
  }, [queryClient]);

  // Main message handler
  const handleMessage = useCallback((wsMessage: WsOutgoingMessage) => {
    console.log('[useChatWebSocket] Received:', wsMessage);

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
        console.error('[WebSocket] Server error:', wsMessage.error);
        break;
        
      default:
        console.warn('[WebSocket] Unknown message type:', wsMessage.type);
    }
  }, [handleNewMessage, handleMessagesRead, handleTyping, handlePresence]);

  // Handle connection status changes
  const handleConnectionChange = useCallback((connected: boolean) => {
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

  // ✅ Join/Leave chat ТОЛЬКО когда connected
  useEffect(() => {
    if (!selectedChatId || !isConnected) {
      return;
    }
    
    websocketService.joinChat(selectedChatId);
    
    return () => {
      // Проверяем актуальное состояние через ref
      if (isConnectedRef.current) {
        websocketService.leaveChat(selectedChatId);
      }
    };
  }, [selectedChatId, isConnected]);

  // ✅ Возвращаем безопасные функции
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