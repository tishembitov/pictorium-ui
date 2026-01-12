// src/modules/chat/components/ChatListItem.tsx

import React, { useState, useMemo } from 'react';
import { Box, Flex, Text, TapArea } from 'gestalt';
import { useUserPresence } from '../hooks/usePresence';
import { formatRelativeTime } from '@/shared/utils/formatters';
import type { ChatWithRecipient, MessageType } from '../types/chat.types';
import { UserAvatar } from '@/modules/user';

interface ChatListItemProps {
  chat: ChatWithRecipient;
  isSelected: boolean;
  onClick: () => void;
}

// Компонент для отображения превью последнего сообщения
const LastMessagePreview: React.FC<{
  message: string | null;
  type: MessageType | null;
}> = ({ message, type }) => {
  const getMediaPreview = (): string | null => {
    switch (type) {
      case 'IMAGE':
        return '📷 Photo';
      case 'VIDEO':
        return '🎥 Video';
      case 'AUDIO':
        return '🎵 Audio';
      case 'FILE':
        return '📎 File';
      default:
        return null;
    }
  };

  const mediaPreview = getMediaPreview();
  
  if (mediaPreview) {
    return <Text size="100" color="subtle">{mediaPreview}</Text>;
  }
  
  if (!message) {
    return <Text size="100" color="subtle">No messages yet</Text>;
  }
  
  return (
    <Text size="100" color="subtle" overflow="noWrap" lineClamp={1}>
      {message}
    </Text>
  );
};

// Компонент для бейджа непрочитанных
const UnreadBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) return null;
  
  const displayCount = count > 99 ? '99+' : String(count);
  
  return (
    <Box
      rounding="circle"
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: '#e60023',
          minWidth: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 6px',
        },
      }}
    >
      <Text size="100" color="inverse" weight="bold">
        {displayCount}
      </Text>
    </Box>
  );
};

// Компонент для online индикатора
const OnlineDot: React.FC = () => (
  <Box
    position="absolute"
    dangerouslySetInlineStyle={{
      __style: {
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        backgroundColor: '#1fa855',
        borderRadius: '50%',
        border: '2px solid white',
        boxShadow: '0 0 4px rgba(31, 168, 85, 0.5)',
      },
    }}
  />
);

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  isSelected,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Получаем статус присутствия
  const { isOnline } = useUserPresence(chat.recipientId);
  
  const recipientName = chat.recipient?.username || 'User';
  const recipientImageId = chat.recipient?.imageId;
  
  const formattedTime = useMemo(() => {
    if (!chat.lastMessageTime) return '';
    return formatRelativeTime(chat.lastMessageTime);
  }, [chat.lastMessageTime]);

  // Определяем цвет фона
  const getBackgroundColor = (): string | undefined => {
    if (isSelected) return 'rgba(0, 0, 0, 0.08)';
    if (isHovered) return 'rgba(0, 0, 0, 0.04)';
    return undefined;
  };

  return (
    <TapArea
      onTap={onClick}
      rounding={2}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box
        padding={3}
        rounding={2}
        position="relative"
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: getBackgroundColor(),
            transition: 'background-color 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Avatar с online индикатором */}
          <Box position="relative">
            <UserAvatar
              imageId={recipientImageId}
              name={recipientName}
              size="md"
            />
            {isOnline && <OnlineDot />}
          </Box>

          {/* Content */}
          <Box flex="grow" overflow="hidden">
            <Flex alignItems="center" justifyContent="between">
              <Text weight="bold" overflow="noWrap" lineClamp={1}>
                {recipientName}
              </Text>
              
              {formattedTime && (
                <Text size="100" color="subtle">
                  {formattedTime}
                </Text>
              )}
            </Flex>
            
            <Box marginTop={1}>
              <Flex alignItems="center" gap={2}>
                <Box flex="grow" overflow="hidden">
                  <LastMessagePreview 
                    message={chat.lastMessage} 
                    type={chat.lastMessageType}
                  />
                </Box>
                
                <UnreadBadge count={chat.unreadCount} />
              </Flex>
            </Box>
          </Box>
        </Flex>
      </Box>
    </TapArea>
  );
};

export default ChatListItem;