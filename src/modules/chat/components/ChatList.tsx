// src/modules/chat/components/ChatList.tsx

import React, { useState, useMemo } from 'react';
import { Box, Flex, Text, SearchField, IconButton, Spinner } from 'gestalt';
import { useChats } from '../hooks/useChats';
import { useChatStore } from '../stores/chatStore';
import { ChatListItem } from './ChatListItem';
import { EmptyState } from '@/shared/components';

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
  onNewChat?: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onChatSelect, onNewChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  
  const { chats, isLoading } = useChats();

  // Filter chats by search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    
    const query = searchQuery.toLowerCase();
    return chats.filter((chat) =>
      chat.recipient?.username?.toLowerCase().includes(query)
    );
  }, [chats, searchQuery]);

  // Render content based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" padding={6}>
          <Spinner accessibilityLabel="Loading chats" show />
        </Box>
      );
    }

    if (filteredChats.length === 0) {
      return (
        <EmptyState
          title="No chats yet"
          description="Start a conversation with someone"
          icon="speech"
          action={onNewChat ? {
            text: 'New Chat',
            onClick: onNewChat,
          } : undefined}
        />
      );
    }

    return filteredChats.map((chat) => (
      <ChatListItem
        key={chat.id}
        chat={chat}
        isSelected={chat.id === selectedChatId}
        onClick={() => onChatSelect(chat.id)}
      />
    ));
  };

  return (
    <Box height="100%" display="flex" direction="column">
      {/* Header */}
      <Box padding={3} color="secondary">
        <Box marginBottom={3}>
          <Flex alignItems="center" justifyContent="between">
            <Text size="400" weight="bold">Chats</Text>
            {onNewChat && (
              <IconButton
                accessibilityLabel="New chat"
                icon="add"
                onClick={onNewChat}
                size="md"
                bgColor="transparent"
              />
            )}
          </Flex>
        </Box>

        {/* Search */}
        <SearchField
          id="chat-search"
          accessibilityLabel="Search chats"
          accessibilityClearButtonLabel="Clear search"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={({ value }) => setSearchQuery(value)}
        />

        {/* Filters */}
        <Box marginTop={2}>
          <Flex gap={2}>
            <Box
              paddingX={3}
              paddingY={1}
              rounding="pill"
              color="secondary"
            >
              <Text size="100">All</Text>
            </Box>
            <Box
              paddingX={3}
              paddingY={1}
              rounding="pill"
              color="default"
            >
              <Text size="100" color="subtle">Unread</Text>
            </Box>
          </Flex>
        </Box>
      </Box>

      {/* Chat list */}
      <Box flex="grow" overflow="auto">
        {renderContent()}
      </Box>
    </Box>
  );
};

export default ChatList;