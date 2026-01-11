// src/modules/chat/components/ChatHeader.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, IconButton, TapArea } from 'gestalt';
import { useShallow } from 'zustand/react/shallow';
import { buildPath } from '@/app/router/routes';
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
  const navigate = useNavigate();
  const { isOnline } = useUserPresence(recipientId);

  // ✅ ПРАВИЛЬНОЕ использование useShallow
  const { typingUsers } = useChatStore(
    useShallow((state) => ({
      selectedChatId: state.selectedChatId,
      typingUsers: state.selectedChatId 
        ? (state.typingUsers[state.selectedChatId] ?? [])
        : [],
    }))
  );

  const isTyping = typingUsers.includes(recipientId);

  const handleProfileClick = () => {
    navigate(buildPath.profile(recipientName));
  };

  return (
    <Box color="secondary" padding={3}>
      <Flex alignItems="center" gap={3}>
        {onBack && (
          <IconButton
            accessibilityLabel="Back"
            icon="arrow-back"
            onClick={onBack}
            size="md"
            bgColor="transparent"
          />
        )}

        <TapArea onTap={handleProfileClick} rounding="circle">
          <Box position="relative">
            <UserAvatar
              imageId={recipientImageId}
              name={recipientName}
              size="md"
            />
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

        <TapArea onTap={handleProfileClick}>
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
        </TapArea>

        <Box flex="grow" />

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