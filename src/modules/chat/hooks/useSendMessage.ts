// src/modules/chat/hooks/useSendMessage.ts

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { useAuthStore } from '@/modules/auth';
import { useToast } from '@/shared/hooks';
import { websocketService } from '../services/websocketService';
import {
  createInitialMessagesData,
  upsertMessage,
  updateChatInList,
} from '../utils/cacheHelpers';
import { generateId } from '@/shared/utils/helpers';
import type {
  MessageResponse,
  MessagesInfiniteData,
  ChatResponse,
} from '../types/chat.types';

// Типы сообщений, поддерживаемые для отправки через WebSocket
type SendableMessageType = 'TEXT' | 'IMAGE';

interface SendMessageParams {
  chatId: string;
  content: string;
  type: SendableMessageType;
  imageId?: string;
}

interface UseSendMessageOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useSendMessage = (options: UseSendMessageOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: async (params: SendMessageParams) => {
      if (!userId) {
        throw new Error('Not authenticated');
      }

      if (!websocketService.isConnected) {
        throw new Error('Not connected to chat');
      }

      return params;
    },

    onMutate: async (params) => {
      if (!userId) return;

      await queryClient.cancelQueries({
        queryKey: queryKeys.chats.messagesInfinite(params.chatId),
      });

      const previousMessages = queryClient.getQueryData<MessagesInfiniteData>(
        queryKeys.chats.messagesInfinite(params.chatId)
      );

      // Create optimistic message
      const optimisticMessage: MessageResponse = {
        id: `temp-${generateId()}`,
        chatId: params.chatId,
        senderId: userId,
        receiverId: '',
        content: params.type === 'TEXT' ? params.content : null,
        type: params.type,
        state: 'SENT',
        imageId: params.imageId || null,
        createdAt: new Date().toISOString(),
      };

      // Update messages cache
      queryClient.setQueryData<MessagesInfiniteData>(
        queryKeys.chats.messagesInfinite(params.chatId),
        (old) => {
          if (!old) {
            return createInitialMessagesData(optimisticMessage);
          }
          return {
            ...old,
            pages: upsertMessage(old.pages, optimisticMessage),
          };
        }
      );

      // Update chats list
      queryClient.setQueryData<ChatResponse[]>(
        queryKeys.chats.lists(),
        (old) => {
          if (!old) return old;
          return updateChatInList(old, {
            chatId: params.chatId,
            lastMessage: params.type === 'TEXT' ? params.content : null,
            lastMessageTime: optimisticMessage.createdAt,
            lastMessageType: params.type,
            lastMessageImageId: params.imageId || null,
          });
        }
      );

      return { previousMessages };
    },

    onSuccess: (params) => {
      // Send via WebSocket
      websocketService.sendMessage(
        params.chatId,
        params.content,
        params.type,
        params.imageId
      );

      onSuccess?.();
    },

    onError: (error: Error, params, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chats.messagesInfinite(params.chatId),
          context.previousMessages
        );
      }

      toast.error(error.message || 'Failed to send message');
      onError?.(error);
    },
  });

  const sendMessage = useCallback(
    (chatId: string, content: string) => {
      mutation.mutate({ chatId, content, type: 'TEXT' });
    },
    [mutation]
  );

  const sendImage = useCallback(
    (chatId: string, imageId: string) => {
      mutation.mutate({ chatId, content: '', type: 'IMAGE', imageId });
    },
    [mutation]
  );

  return {
    sendMessage,
    sendImage,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useSendMessage;