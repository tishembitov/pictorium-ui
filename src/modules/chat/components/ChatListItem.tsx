// src/modules/chat/components/ChatListItem.tsx

import React from 'react';
import { Box, Flex, Text, TapArea, Icon } from 'gestalt';
import { UserAvatar } from '@/modules/user';
import { useImageUrl } from '@/modules/storage';
import { useUserPresence } from '../hooks/usePresence';
import { OnlineIndicator } from './OnlineIndicator';
import { ChatBadge } from './ChatBadge';
import { formatShortRelativeTime } from '@/shared/utils/formatters';
import type { ChatWithRecipient, MessageType } from '../types/chat.types';

interface ChatListItemProps {
  chat: ChatWithRecipient;
  isSelected: boolean;
  onClick: () => void;
  searchQuery?: string;
}

type GestaltIconName = React.ComponentProps<typeof Icon>['icon'];

// ==================== Highlight Component ====================

interface HighlightTextProps {
  text: string;
  query: string;
  color?: 'default' | 'subtle';
}

// Helper to escape regex special characters
function escapeRegex(str: string): string {
  return str.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

// Pre-compute parts with their positions
interface TextPart {
  text: string;
  isMatch: boolean;
  position: number;
}

function splitTextWithPositions(text: string, query: string): TextPart[] {
  if (!query.trim()) {
    return [{ text, isMatch: false, position: 0 }];
  }

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const rawParts = text.split(regex);
  
  const parts: TextPart[] = [];
  let currentPosition = 0;
  
  for (const part of rawParts) {
    if (part) {
      parts.push({
        text: part,
        isMatch: part.toLowerCase() === query.toLowerCase(),
        position: currentPosition,
      });
      currentPosition += part.length;
    }
  }
  
  return parts;
}

const HighlightText: React.FC<HighlightTextProps> = ({ 
  text, 
  query, 
  color = 'default' 
}) => {
  // Compute parts with positions before render (no mutation during map)
  const parts = splitTextWithPositions(text, query);

  if (parts.length === 1 && !parts[0]?.isMatch) {
    return (
      <Text size="200" color={color} lineClamp={1}>
        {text}
      </Text>
    );
  }

  return (
    <Text size="200" color={color} lineClamp={1}>
      {parts.map((part) => {
        const key = `${part.isMatch ? 'match' : 'text'}-${part.position}-${part.text.slice(0, 10)}`;

        if (part.isMatch) {
          return (
            <Box 
              key={key}
              display="inlineBlock"
              dangerouslySetInlineStyle={{
                __style: {
                  backgroundColor: '#fff3cd',
                  borderRadius: 2,
                  padding: '0 2px',
                },
              }}
            >
              <Text size="200" weight="bold" color="dark">
                {part.text}
              </Text>
            </Box>
          );
        }
        return <React.Fragment key={key}>{part.text}</React.Fragment>;
      })}
    </Text>
  );
};

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
    icon: GestaltIconName;
    label: string;
  } => {
    switch (type) {
      case 'IMAGE':
        return { icon: 'camera', label: 'Photo' };
      case 'VIDEO':
        return { icon: 'video-camera', label: 'Video' };
      case 'AUDIO':
        return { icon: 'speech', label: 'Audio' };
      case 'FILE':
      default:
        return { icon: 'terms', label: 'File' };
    }
  };

  const { icon, label } = getMediaIcon();

  return (
    <Flex alignItems="center" gap={1}>
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
  searchQuery?: string;
}

const LastMessagePreview: React.FC<LastMessagePreviewProps> = ({ 
  chat, 
  searchQuery = '' 
}) => {
  const { lastMessage, lastMessageType, lastMessageImageId } = chat;

  if (lastMessageType && lastMessageType !== 'TEXT') {
    return (
      <MediaPreview 
        type={lastMessageType} 
        imageId={lastMessageImageId} 
      />
    );
  }

  if (lastMessage) {
    // Use highlight if search query matches message
    if (searchQuery.trim() && lastMessage.toLowerCase().includes(searchQuery.toLowerCase())) {
      return (
        <HighlightText 
          text={lastMessage} 
          query={searchQuery} 
          color="subtle" 
        />
      );
    }

    return (
      <Text size="200" color="subtle" lineClamp={1}>
        {lastMessage}
      </Text>
    );
  }

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
  searchQuery = '',
}) => {
  const { isOnline } = useUserPresence(chat.recipientId);

  const displayName = chat.recipient?.username || 'Loading...';
  const avatarImageId = chat.recipient?.imageId ?? null;

  // Check if username matches search
  const usernameMatches = searchQuery.trim() && 
    displayName.toLowerCase().includes(searchQuery.toLowerCase());

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
          <Box position="relative" dangerouslySetInlineStyle={{ __style: { flexShrink: 0 } }}>
            <UserAvatar
              imageId={avatarImageId}
              name={displayName}
              size="md"
            />
            {isOnline && (
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
          <Box flex="grow" minWidth={0}>
            {/* Header: name and time */}
            <Flex alignItems="center" gap={2}>
              <Box flex="grow" minWidth={0}>
                {usernameMatches ? (
                  <HighlightText 
                    text={displayName} 
                    query={searchQuery} 
                  />
                ) : (
                  <Text weight="bold" size="200" lineClamp={1}>
                    {displayName}
                  </Text>
                )}
              </Box>
              
              {chat.lastMessageTime && (
                <Box dangerouslySetInlineStyle={{ __style: { flexShrink: 0 } }}>
                  <Text
                    size="100"
                    color={chat.unreadCount > 0 ? 'success' : 'subtle'}
                  >
                    {formatShortRelativeTime(chat.lastMessageTime)}
                  </Text>
                </Box>
              )}
            </Flex>

            {/* Footer: message preview and unread badge */}
            <Box marginTop={1}>
              <Flex alignItems="center" gap={2}>
                <Box flex="grow" minWidth={0}>
                  <LastMessagePreview 
                    chat={chat} 
                    searchQuery={searchQuery} 
                  />
                </Box>
                
                {chat.unreadCount > 0 && (
                  <Box dangerouslySetInlineStyle={{ __style: { flexShrink: 0 } }}>
                    <ChatBadge count={chat.unreadCount} />
                  </Box>
                )}
              </Flex>
            </Box>
          </Box>
        </Flex>
      </Box>
    </TapArea>
  );
};

export default ChatListItem;