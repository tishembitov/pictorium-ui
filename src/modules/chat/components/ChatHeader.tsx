// src/modules/chat/components/ChatHeader.tsx

import React from 'react';
import { Box, Flex, Text, IconButton, TapArea } from 'gestalt';
import { UserAvatar } from '@/modules/user';
import { OnlineIndicator } from './OnlineIndicator';
import { useUserPresence } from '../hooks/usePresence';
import { useChatStore } from '../stores/chatStore';

interface ChatHeaderProps {
  recipientId: string;
  recipientName: string;
  recipientImageId?: string | null;
  onBack?: () => void;
  onInfoClick?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  recipientId,
  recipientName,
  recipientImageId,
  onBack,
  onInfoClick,
}) => {
  const { isOnline } = useUserPresence(recipientId);
  const typingUsers = useChatStore((state) => 
    state.typingUsers[useChatStore.getState().selectedChatId || ''] || []
  );

  const isTyping = typingUsers.includes(recipientId);

  const handleProfileClick = () => {
    // Navigate to user profile
    // navigate(`/profile/${recipientId}`);
  };

  return (
    <Box color="secondary" padding={3}>
      <Flex alignItems="center" gap={3}>
        {/* Back button (mobile) */}
        {onBack && (
          <IconButton
            accessibilityLabel="Back"
            icon="arrow-back"
            onClick={onBack}
            size="md"
            bgColor="transparent"
          />
        )}

        {/* User info */}
        <TapArea onTap={handleProfileClick} rounding="circle">
          <Box position="relative">
            <UserAvatar
              imageId={recipientImageId}
              name={recipientName}
              size="md"
            />
            {/* Online indicator */}
            <Box
              position="absolute"
              dangerouslySetInlineStyle={{
                __style: { bottom: 0, right: 0 },
              }}
            >
              <OnlineIndicator isOnline={isOnline} size="sm" />
            </Box>
          </Box>
        </TapArea>

        <Flex direction="column" flex="grow">
          <Text weight="bold">{recipientName}</Text>
          {isTyping ? (
            <Text size="100" color="subtle" italic>
              typing...
            </Text>
          ) : (
            <Text size="100" color="subtle">
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          )}
        </Flex>

        {/* Actions */}
        <Flex gap={2}>
          <IconButton
            accessibilityLabel="Video call"
            icon="video-camera"
            onClick={() => {}}
            size="md"
            bgColor="transparent"
            disabled
          />
          <IconButton
            accessibilityLabel="Voice call"
            icon="phone"
            onClick={() => {}}
            size="md"
            bgColor="transparent"
            disabled
          />
          {onInfoClick && (
            <IconButton
              accessibilityLabel="Chat info"
              icon="ellipsis"
              onClick={onInfoClick}
              size="md"
              bgColor="transparent"
            />
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default ChatHeader;