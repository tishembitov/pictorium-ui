// src/modules/chat/hooks/useStartChat.ts

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildPath } from '@/app/router/routes';
import { useGetOrCreateChat } from './useChat';

interface UseStartChatOptions {
  onSuccess?: (chatId: string) => void;
  onError?: (error: Error) => void;
}

interface UseStartChatReturn {
  startChat: (recipientId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to start a chat with a user
 * Gets existing chat or creates new one, then navigates to it
 */
export const useStartChat = (options: UseStartChatOptions = {}): UseStartChatReturn => {
  const { onSuccess, onError } = options;
  const navigate = useNavigate();
  const { getOrCreateChat, isLoading: isCreating } = useGetOrCreateChat();
  
  const [error, setError] = useState<Error | null>(null);

  const startChat = useCallback(async (recipientId: string) => {
    setError(null);

    try {
      // Get existing chat or create new one
      const chat = await getOrCreateChat(recipientId);
      
      // Navigate to chat
      navigate(buildPath.messages(chat.id));
      
      onSuccess?.(chat.id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start chat');
      setError(error);
      onError?.(error);
    }
  }, [getOrCreateChat, navigate, onSuccess, onError]);

  return {
    startChat,
    isLoading: isCreating,
    error,
  };
};

export default useStartChat;