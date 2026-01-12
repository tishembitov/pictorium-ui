// src/app/providers/chatContext.ts

import { createContext, useContext } from 'react';

export interface ChatContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  sendTyping: (chatId: string, typing: boolean) => void;
  markAsRead: (chatId: string) => void;
}

export const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * Hook to access chat WebSocket context
 */
export const useChatContext = (): ChatContextValue => {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  
  return context;
};