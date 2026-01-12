// src/pages/MessagesPage.tsx

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box } from 'gestalt';
import { useIsMobile } from '@/shared/hooks';
import { 
  ChatList, 
  ChatWindow, 
  NewChatModal, 
  useTotalUnread 
} from '@/modules/chat';
import { EmptyState } from '@/shared/components';

export const MessagesPage: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Sync total unread count on mount
  useTotalUnread();

  const handleChatSelect = useCallback((selectedChatId: string) => {
    navigate(`/messages/${selectedChatId}`);
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate('/messages');
  }, [navigate]);

  const handleNewChat = useCallback(() => {
    setIsNewChatOpen(true);
  }, []);

  const handleChatCreated = useCallback((newChatId: string) => {
    navigate(`/messages/${newChatId}`);
  }, [navigate]);

  // Mobile view: show list or chat
  if (isMobile) {
    if (chatId) {
      return (
        <Box height="calc(100vh - 80px)">
          <ChatWindow chatId={chatId} onBack={handleBack} />
        </Box>
      );
    }

    return (
      <Box height="calc(100vh - 80px)">
        <ChatList onChatSelect={handleChatSelect} onNewChat={handleNewChat} />
        <NewChatModal
          isOpen={isNewChatOpen}
          onClose={() => setIsNewChatOpen(false)}
          onChatCreated={handleChatCreated}
        />
      </Box>
    );
  }

  // Desktop view: side by side
  return (
    <Box height="calc(100vh - 80px)" display="flex">
      {/* Chat list sidebar */}
      <Box
        width={350}
        height="100%"
        dangerouslySetInlineStyle={{
          __style: {
            borderRight: '1px solid var(--border-light)',
          },
        }}
      >
        <ChatList onChatSelect={handleChatSelect} onNewChat={handleNewChat} />
      </Box>

      {/* Chat window or empty state */}
      <Box flex="grow" height="100%">
        {chatId ? (
          <ChatWindow chatId={chatId} />
        ) : (
          <Box
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="secondary"
          >
            <EmptyState
              title="Select a chat"
              description="Choose a conversation or start a new one"
              icon="speech"
            />
          </Box>
        )}
      </Box>

      {/* New chat modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onChatCreated={handleChatCreated}
      />
    </Box>
  );
};

export default MessagesPage;