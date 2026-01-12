// src/app/providers/ChatProvider.tsx

import React, { type ReactNode } from 'react';
import { useAuthStore } from '@/modules/auth';
import { useChatWebSocket } from '@/modules/chat';
import { ChatContext } from './chatContext';

/**
 * Internal provider component that uses WebSocket hook
 */
const ChatProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const websocket = useChatWebSocket();

  return (
    <ChatContext.Provider value={websocket}>
      {children}
    </ChatContext.Provider>
  );
};

interface ChatProviderProps {
  children: ReactNode;
}

/**
 * Wrapper that conditionally renders ChatProvider only for authenticated users.
 * This ensures WebSocket connection is established only when user is logged in.
 */
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Don't render ChatProvider until auth is initialized
  if (!isInitialized) {
    return <>{children}</>;
  }

  // Only wrap with ChatProvider if authenticated
  if (isAuthenticated) {
    return (
      <ChatProviderInner>
        {children}
      </ChatProviderInner>
    );
  }

  return <>{children}</>;
};

export default ChatProvider;