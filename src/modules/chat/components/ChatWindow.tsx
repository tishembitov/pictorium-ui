// src/modules/chat/components/ChatWindow.tsx

import React, { useEffect } from 'react';
import { Box } from 'gestalt';
import { useChat } from '../hooks/useChat';
import { useMarkAsRead } from '../hooks/useMarkAsRead';
import { useChatStore } from '../stores/chatStore';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { FullPageLoader, EmptyState } from '@/shared/components';
import { useUser } from '@/modules/user';

interface ChatWindowProps {
  chatId: string;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, onBack }) => {
  const { chat, isLoading } = useChat(chatId);
  const { markAsRead } = useMarkAsRead();
  const setSelectedChat = useChatStore((state) => state.setSelectedChat);

  // Get recipient user info
  const { user: recipient } = useUser(chat?.recipientId);

  // Set selected chat and mark as read
  useEffect(() => {
    setSelectedChat(chatId);
    markAsRead(chatId);

    return () => {
      setSelectedChat(null);
    };
  }, [chatId, setSelectedChat, markAsRead]);

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!chat) {
    return (
      <EmptyState
        title="Chat not found"
        description="This chat may have been deleted"
        icon="speech"
      />
    );
  }

  const recipientName = recipient?.username || 'User';
  const recipientImageId = recipient?.imageId;

  return (
    <Box height="100%" display="flex" direction="column">
      <ChatHeader
        recipientId={chat.recipientId}
        recipientName={recipientName}
        recipientImageId={recipientImageId}
        onBack={onBack}
      />

      <Box flex="grow" overflow="hidden">
        <MessageList chatId={chatId} />
      </Box>

      <MessageInput chatId={chatId} />
    </Box>
  );
};

export default ChatWindow;