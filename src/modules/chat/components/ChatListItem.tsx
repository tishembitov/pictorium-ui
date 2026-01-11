// src/modules/chat/components/ChatListItem.tsx

import React from 'react';
import { Box, Flex, Text, TapArea } from 'gestalt';
import { UserAvatar } from '@/modules/user';
import { OnlineIndicator } from './OnlineIndicator';
import { ChatBadge } from './ChatBadge';
import { formatShortRelativeTime } from '@/shared/utils/formatters';
import type { ChatWithRecipient } from '../types/chat.types';

interface ChatListItemProps {
  chat: ChatWithRecipient;
  isSelected: boolean;
  onClick: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  isSelected,
  onClick,
}) => {
  const displayMessage = chat.lastMessage || 'No messages yet';
  const truncatedMessage = displayMessage.length > 30 
    ? displayMessage.substring(0, 27) + '...' 
    : displayMessage;

  return (
    <TapArea onTap={onClick} rounding={2}>
      <Box
        padding={3}
        rounding={2}
        color={isSelected ? 'secondary' : 'default'}
        dangerouslySetInlineStyle={{
          __style: {
            borderBottom: '1px solid var(--border-light)',
            transition: 'background-color 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Avatar with online indicator */}
          <Box position="relative">
            <UserAvatar
              imageId={chat.recipient?.imageId}
              name={chat.recipient?.username || 'User'}
              size="md"
            />
            {chat.isOnline && (
              <Box
                position="absolute"
                dangerouslySetInlineStyle={{
                  __style: { bottom: 0, right: 0 },
                }}
              >
                <OnlineIndicator isOnline size="sm" />
              </Box>
            )}
          </Box>

          {/* Chat info */}
          <Flex direction="column" flex="grow" gap={1}>
            <Flex alignItems="center" justifyContent="between">
              <Text weight="bold" size="200" lineClamp={1}>
                {chat.recipient?.username || 'Unknown'}
              </Text>
              {chat.lastMessageTime && (
                <Text 
                  size="100" 
                  color={chat.unreadCount > 0 ? 'success' : 'subtle'}
                >
                  {formatShortRelativeTime(chat.lastMessageTime)}
                </Text>
              )}
            </Flex>
            <Flex alignItems="center" justifyContent="between">
              <Text size="200" color="subtle" lineClamp={1}>
                {truncatedMessage}
              </Text>
              {chat.unreadCount > 0 && (
                <ChatBadge count={chat.unreadCount} />
              )}
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </TapArea>
  );
};

export default ChatListItem;