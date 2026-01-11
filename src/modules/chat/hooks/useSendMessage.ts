// src/modules/chat/hooks/useSendMessage.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '@/shared/api/apiClient';
import { queryKeys } from '@/app/config/queryClient';
import { useAuthStore } from '@/modules/auth';
import { useToast } from '@/shared/hooks';
import { useAddMessageToCache } from './useMessages';
import type { 
  MessageResponse, 
  MessageType,
  MessagesInfiniteData,
  PageMessageResponse,
} from '../types/chat.types';
import { generateId } from '@/shared/utils/helpers';

interface SendMessageParams {
  chatId: string;
  content?: string;
  type?: MessageType;
  imageId?: string;
}

// API endpoint for sending messages
const sendMessageApi = async (params: SendMessageParams): Promise<MessageResponse> => {
  const response = await post<MessageResponse>('/api/v1/messages', {
    chatId: params.chatId,
    content: params.content,
    type: params.type || 'TEXT',
    imageId: params.imageId,
  });
  return response;
};

/**
 * Replaces temporary optimistic message with real one from server
 */
const replaceOptimisticMessage = (
  pages: PageMessageResponse[],
  realMessage: MessageResponse
): PageMessageResponse[] => {
  return pages.map((page) => ({
    ...page,
    content: page.content.map((msg) =>
      msg.id.startsWith('temp-') ? realMessage : msg
    ),
  }));
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);
  const { addMessage } = useAddMessageToCache();

  const mutation = useMutation({
    mutationFn: sendMessageApi,

    // Optimistic update
    onMutate: async (params) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.chats.messagesInfinite(params.chatId) 
      });

      // Create optimistic message
      const optimisticMessage: MessageResponse = {
        id: `temp-${generateId()}`,
        chatId: params.chatId,
        senderId: userId || '',
        receiverId: '',
        content: params.content || null,
        type: params.type || 'TEXT',
        state: 'SENT',
        imageId: params.imageId || null,
        createdAt: new Date().toISOString(),
      };

      // Add to cache
      addMessage(params.chatId, optimisticMessage);

      return { optimisticMessage };
    },

    onError: (_error, params, context) => {
      // Remove optimistic message on error
      if (context?.optimisticMessage) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.chats.messagesInfinite(params.chatId) 
        });
      }
      
      toast.error('Failed to send message');
    },

    onSuccess: (data, params) => {
      // Replace optimistic message with real one
      queryClient.setQueryData<MessagesInfiniteData>(
        queryKeys.chats.messagesInfinite(params.chatId),
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: replaceOptimisticMessage(old.pages, data),
          };
        }
      );
    },
  });

  const sendMessage = (chatId: string, content: string) => {
    return mutation.mutateAsync({ chatId, content, type: 'TEXT' });
  };

  const sendImage = (chatId: string, imageId: string) => {
    return mutation.mutateAsync({ chatId, type: 'IMAGE', imageId });
  };

  return {
    sendMessage,
    sendImage,
    send: mutation.mutate,
    sendAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useSendMessage;