// src/modules/chat/hooks/useChatWebSocket.ts

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { useAuth } from '@/modules/auth';
import { useChatStore } from '../stores/chatStore';
import { websocketService } from '../services/websocketService';
import type { 
  WebSocketMessage, 
  MessageResponse, 
  ChatResponse,
  MessagesInfiniteData,
  MessageState,
} from '../types/chat.types';

// ===== Helper functions for cache updates =====

/**
 * Creates updated pages with a new message added
 */
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

/**
 * Creates updated pages with message states changed
 */
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

/**
 * Creates updated chats list with new message info
 */
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
  
  const setConnected = useChatStore((state) => state.setConnected);
  const setConnecting = useChatStore((state) => state.setConnecting);
  const incrementTotalUnread = useChatStore((state) => state.incrementTotalUnread);
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  
  // Use ref to access current selectedChatId in callback
  const selectedChatIdRef = useRef(selectedChatId);
  
  // Sync ref with state via effect
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  // Handle media messages (MESSAGE, IMAGE, VIDEO, etc.)
  const handleMediaMessage = useCallback((wsMessage: WebSocketMessage) => {
    const message: MessageResponse = {
      id: wsMessage.messageId || `ws-${Date.now()}`,
      chatId: wsMessage.chatId,
      senderId: wsMessage.senderId,
      receiverId: wsMessage.receiverId,
      content: wsMessage.content || null,
      type: wsMessage.messageType || 'TEXT',
      state: 'DELIVERED',
      imageId: wsMessage.imageId || null,
      createdAt: wsMessage.timestamp,
    };

    // Add to messages cache
    queryClient.setQueryData<MessagesInfiniteData>(
      queryKeys.chats.messagesInfinite(wsMessage.chatId),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: createPagesWithNewMessage(old.pages, message),
        };
      }
    );

    // Update chat in list
    const isCurrentChat = selectedChatIdRef.current === wsMessage.chatId;
    
    queryClient.setQueryData<ChatResponse[]>(
      queryKeys.chats.lists(),
      (old) => {
        if (!old) return old;
        return createChatsWithNewMessage(
          old,
          wsMessage.chatId,
          wsMessage.content,
          wsMessage.timestamp,
          isCurrentChat
        );
      }
    );

    // Increment total unread if not in this chat
    if (!isCurrentChat) {
      incrementTotalUnread();
    }
  }, [queryClient, incrementTotalUnread]);

  // Handle message state updates (SEEN, DELIVERED)
  const handleStateUpdate = useCallback((wsMessage: WebSocketMessage) => {
    const newState: MessageState = wsMessage.type === 'SEEN' ? 'READ' : 'DELIVERED';
    
    queryClient.setQueryData<MessagesInfiniteData>(
      queryKeys.chats.messagesInfinite(wsMessage.chatId),
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: createPagesWithUpdatedState(old.pages, newState),
        };
      }
    );
  }, [queryClient]);

  // Handle presence updates (ONLINE, OFFLINE)
  const handlePresenceUpdate = useCallback((wsMessage: WebSocketMessage) => {
    queryClient.setQueryData(
      queryKeys.presence.byUser(wsMessage.senderId),
      wsMessage.type === 'ONLINE'
    );
  }, [queryClient]);

  // Main message handler
  const handleMessage = useCallback((wsMessage: WebSocketMessage) => {
    console.log('[useChatWebSocket] Received:', wsMessage);

    const isMediaMessage = 
      wsMessage.type === 'MESSAGE' ||
      wsMessage.type === 'IMAGE' ||
      wsMessage.type === 'VIDEO' ||
      wsMessage.type === 'AUDIO' ||
      wsMessage.type === 'FILE';

    if (isMediaMessage) {
      handleMediaMessage(wsMessage);
      return;
    }

    if (wsMessage.type === 'SEEN' || wsMessage.type === 'DELIVERED') {
      handleStateUpdate(wsMessage);
      return;
    }

    if (wsMessage.type === 'ONLINE' || wsMessage.type === 'OFFLINE') {
      handlePresenceUpdate(wsMessage);
    }
  }, [handleMediaMessage, handleStateUpdate, handlePresenceUpdate]);

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

  return {
    isConnected: useChatStore((state) => state.isConnected),
    isConnecting: useChatStore((state) => state.isConnecting),
    sendTyping: (chatId: string, isTyping: boolean) => 
      websocketService.sendTyping(chatId, isTyping),
  };
};

export default useChatWebSocket;