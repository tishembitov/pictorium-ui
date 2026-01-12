// src/modules/chat/components/ChatList.tsx

import React, { useState, useMemo } from 'react';
import { Box, Flex, Text, SearchField, IconButton, Spinner, TapArea } from 'gestalt';
import { useChats } from '../hooks/useChats';
import { useChatStore } from '../stores/chatStore';
import { ChatListItem } from './ChatListItem';
import { EmptyState } from '@/shared/components';

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
  onNewChat?: () => void;
}

type FilterType = 'all' | 'unread';

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}

const FilterButton: React.FC<FilterButtonProps> = ({ 
  label, 
  isActive, 
  onClick,
  count,
}) => (
  <TapArea onTap={onClick} rounding="pill">
    <Box
      paddingX={3}
      paddingY={1}
      rounding="pill"
      color={isActive ? 'selected' : 'secondary'}
      dangerouslySetInlineStyle={{
        __style: {
          transition: 'all 0.15s ease',
        },
      }}
    >
      <Flex alignItems="center" gap={1}>
        <Text 
          size="100" 
          color={isActive ? 'inverse' : 'default'}
          weight={isActive ? 'bold' : 'normal'}
        >
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <Box
            rounding="circle"
            paddingX={1}
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : 'var(--color-primary)',
                minWidth: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
            }}
          >
            <Text size="100" color="inverse" weight="bold">
              {count > 99 ? '99+' : count}
            </Text>
          </Box>
        )}
      </Flex>
    </Box>
  </TapArea>
);

export const ChatList: React.FC<ChatListProps> = ({ onChatSelect, onNewChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  
  const { chats, isLoading } = useChats();

  // Count unread chats
  const unreadCount = useMemo(() => {
    return chats.filter((chat) => chat.unreadCount > 0).length;
  }, [chats]);

  // Filter chats
  const filteredChats = useMemo(() => {
    let result = chats;

    // Apply unread filter
    if (filter === 'unread') {
      result = result.filter((chat) => chat.unreadCount > 0);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((chat) =>
        chat.recipient?.username?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [chats, filter, searchQuery]);

  // Render content based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" padding={6}>
          <Spinner accessibilityLabel="Loading chats" show />
        </Box>
      );
    }

    if (chats.length === 0) {
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

    if (filteredChats.length === 0) {
      if (filter === 'unread') {
        return (
          <EmptyState
            title="No unread messages"
            description="You're all caught up!"
            icon="check-circle"
          />
        );
      }

      return (
        <EmptyState
          title="No chats found"
          description="Try a different search"
          icon="search"
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
            <FilterButton
              label="All"
              isActive={filter === 'all'}
              onClick={() => setFilter('all')}
            />
            <FilterButton
              label="Unread"
              isActive={filter === 'unread'}
              onClick={() => setFilter('unread')}
              count={unreadCount}
            />
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