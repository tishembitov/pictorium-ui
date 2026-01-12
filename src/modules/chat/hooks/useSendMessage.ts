// src/modules/chat/hooks/useSendMessage.ts

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { useAuthStore } from '@/modules/auth';
import { useToast } from '@/shared/hooks';
import { websocketService } from '../services/websocketService';
import type { 
  MessageResponse, 
  MessagesInfiniteData,
  ChatResponse,
  MessageType,
} from '../types/chat.types';
import { generateId } from '@/shared/utils/helpers';

// ===== Helper functions =====

interface UpdateChatWithMessageParams {
  chatId: string;
  content: string | null;
  timestamp: string;
  messageType: MessageType;
  imageId: string | null;
}

const updateChatWithMessage = (
  chats: ChatResponse[],
  params: UpdateChatWithMessageParams
): ChatResponse[] => {
  const { chatId, content, timestamp, messageType, imageId } = params;
  
  return chats.map((chat) => {
    if (chat.id === chatId) {
      return {
        ...chat,
        lastMessage: messageType === 'TEXT' ? content : null,
        lastMessageTime: timestamp,
        lastMessageType: messageType,
        lastMessageImageId: imageId,
      };
    }
    return chat;
  });
};

// ===== Main Hook =====

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const addOptimisticMessage = useCallback((chatId: string, message: MessageResponse) => {
    // Update infinite query
    queryClient.setQueryData<MessagesInfiniteData>(
      queryKeys.chats.messagesInfinite(chatId),
      (old) => {
        if (!old) return old;
        
        const newPages = [...old.pages];
        const firstPage = newPages[0];
        if (firstPage) {
          newPages[0] = {
            ...firstPage,
            content: [message, ...firstPage.content],
          };
        }
        
        return { ...old, pages: newPages };
      }
    );

    // Update chats list with all media fields
    queryClient.setQueryData<ChatResponse[]>(
      queryKeys.chats.lists(),
      (old) => {
        if (!old) return old;
        return updateChatWithMessage(old, {
          chatId,
          content: message.content,
          timestamp: message.createdAt,
          messageType: message.type,
          imageId: message.imageId,
        });
      }
    );
  }, [queryClient]);

  const sendMessage = useCallback((chatId: string, content: string) => {
    if (!userId) {
      toast.error('Not authenticated');
      return;
    }

    // Create optimistic message
    const optimisticMessage: MessageResponse = {
      id: `temp-${generateId()}`,
      chatId,
      senderId: userId,
      receiverId: '',
      content,
      type: 'TEXT',
      state: 'SENT',
      imageId: null,
      createdAt: new Date().toISOString(),
    };

    // Add to cache optimistically
    addOptimisticMessage(chatId, optimisticMessage);

    // Send via WebSocket
    websocketService.sendMessage(chatId, content, 'TEXT');
  }, [userId, addOptimisticMessage, toast]);

  const sendImage = useCallback((chatId: string, imageId: string) => {
    if (!userId) {
      toast.error('Not authenticated');
      return;
    }

    // Create optimistic message
    const optimisticMessage: MessageResponse = {
      id: `temp-${generateId()}`,
      chatId,
      senderId: userId,
      receiverId: '',
      content: null,
      type: 'IMAGE',
      state: 'SENT',
      imageId,
      createdAt: new Date().toISOString(),
    };

    // Add to cache optimistically
    addOptimisticMessage(chatId, optimisticMessage);

    // Send via WebSocket
    websocketService.sendMessage(chatId, '', 'IMAGE', imageId);
  }, [userId, addOptimisticMessage, toast]);

  return {
    sendMessage,
    sendImage,
    isLoading: false,
  };
};

export default useSendMessage;