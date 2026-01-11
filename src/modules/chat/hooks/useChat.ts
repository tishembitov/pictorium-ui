// src/modules/chat/hooks/useChat.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { chatApi } from '../api/chatApi';
import { useToast } from '@/shared/hooks';

interface UseChatOptions {
  enabled?: boolean;
}

export const useChat = (chatId: string | null | undefined, options: UseChatOptions = {}) => {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: queryKeys.chats.byId(chatId || ''),
    queryFn: () => chatApi.getById(chatId!),
    enabled: enabled && !!chatId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    chat: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get or create chat with a user
 */
export const useGetOrCreateChat = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (recipientId: string) => chatApi.getOrCreateChat(recipientId),
    onSuccess: (chat) => {
      // Update chat in cache
      queryClient.setQueryData(queryKeys.chats.byId(chat.id), chat);
      // Invalidate chats list
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create chat');
    },
  });

  return {
    getOrCreateChat: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

/**
 * Hook to delete a chat
 */
export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (chatId: string) => chatApi.deleteChat(chatId),
    onSuccess: (_, chatId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.chats.byId(chatId) });
      queryClient.removeQueries({ queryKey: queryKeys.chats.messages(chatId) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
      
      toast.success('Chat deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete chat');
    },
  });

  return {
    deleteChat: mutation.mutate,
    deleteChatAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export default useChat;