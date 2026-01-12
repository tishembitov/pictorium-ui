// src/modules/chat/components/ChatListItem.tsx

import React from 'react';
import { Box, Flex, Text, TapArea, Icon } from 'gestalt';
import { UserAvatar } from '@/modules/user';
import { useImageUrl } from '@/modules/storage';
import { OnlineIndicator } from './OnlineIndicator';
import { ChatBadge } from './ChatBadge';
import { formatShortRelativeTime } from '@/shared/utils/formatters';
import type { ChatWithRecipient, MessageType } from '../types/chat.types';

interface ChatListItemProps {
  chat: ChatWithRecipient;
  isSelected: boolean;
  onClick: () => void;
}

type GestaltIconName = React.ComponentProps<typeof Icon>['icon'];

// ==================== Sub-components ====================

interface MediaPreviewProps {
  type: MessageType;
  imageId: string | null;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ type, imageId }) => {
  const { data: imageData } = useImageUrl(imageId, {
    enabled: type === 'IMAGE' && !!imageId,
  });

  const getMediaIcon = (): {
    icon: GestaltIconName; // Используем точный тип из библиотеки
    label: string;
  } => {
    switch (type) {
      case 'IMAGE':
        return { icon: 'camera', label: 'Photo' }; // или 'image'
      case 'VIDEO':
        return { icon: 'video-camera', label: 'Video' };
      case 'AUDIO':
        // 'music' нет в Gestalt. Используем 'speech' (для голосовых) или 'play'
        return { icon: 'speech', label: 'Audio' }; 
      case 'FILE':
      default:
        return { icon: 'terms', label: 'File' };
    }
  };

  const { icon, label } = getMediaIcon();

  return (
    <Flex alignItems="center" gap={1}>
      {/* Миниатюра для изображений */}
      {type === 'IMAGE' && imageData?.url ? (
        <Box
          width={20}
          height={20}
          rounding={1}
          overflow="hidden"
          dangerouslySetInlineStyle={{
            __style: {
              flexShrink: 0,
            },
          }}
        >
          <img
            src={imageData.url}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
      ) : (
        <Icon
          accessibilityLabel={label}
          icon={icon}
          size={14}
          color="subtle"
        />
      )}
      <Text size="200" color="subtle" lineClamp={1}>
        {label}
      </Text>
    </Flex>
  );
};

interface LastMessagePreviewProps {
  chat: ChatWithRecipient;
}

const LastMessagePreview: React.FC<LastMessagePreviewProps> = ({ chat }) => {
  const { lastMessage, lastMessageType, lastMessageImageId } = chat;

  // Медиа сообщение
  if (lastMessageType && lastMessageType !== 'TEXT') {
    return (
      <MediaPreview 
        type={lastMessageType} 
        imageId={lastMessageImageId} 
      />
    );
  }

  // Текстовое сообщение
  if (lastMessage) {
    const truncated = lastMessage.length > 30
      ? lastMessage.substring(0, 27) + '...'
      : lastMessage;

    return (
      <Text size="200" color="subtle" lineClamp={1}>
        {truncated}
      </Text>
    );
  }

  // Нет сообщений
  return (
    <Text size="200" color="subtle" italic>
      No messages yet
    </Text>
  );
};

// ==================== Main Component ====================

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  isSelected,
  onClick,
}) => {
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
            {/* Header: name and time */}
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

            {/* Footer: message preview and unread badge */}
            <Flex alignItems="center" justifyContent="between" gap={2}>
              <Box flex="grow" overflow="hidden">
                <LastMessagePreview chat={chat} />
              </Box>
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