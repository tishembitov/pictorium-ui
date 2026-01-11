// src/modules/chat/components/MessageItem.tsx

import React, { useMemo } from 'react';
import { Box, Flex, Text, Icon, Mask } from 'gestalt';
import { useImageUrl } from '@/modules/storage';
import { formatShortRelativeTime } from '@/shared/utils/formatters';
import type { MessageResponse, MessageState } from '../types/chat.types';

interface MessageItemProps {
  message: MessageResponse;
  isSelf: boolean;
}

const MessageStateIcon: React.FC<{ state: MessageState }> = ({ state }) => {
  if (state === 'SENT') {
    return <Icon accessibilityLabel="Sent" icon="check" size={12} color="subtle" />;
  }
  
  if (state === 'DELIVERED') {
    return (
      <Flex gap={0}>
        <Icon accessibilityLabel="Delivered" icon="check" size={12} color="subtle" />
        <Box marginStart={-1}>
          <Icon accessibilityLabel="" icon="check" size={12} color="subtle" />
        </Box>
      </Flex>
    );
  }
  
  // READ
  return (
    <Flex gap={0}>
      <Icon accessibilityLabel="Read" icon="check" size={12} color="info" />
      <Box marginStart={-1}>
        <Icon accessibilityLabel="" icon="check" size={12} color="info" />
      </Box>
    </Flex>
  );
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isSelf
}) => {
  const { data: imageData } = useImageUrl(message.imageId, {
    enabled: !!message.imageId && message.type === 'IMAGE',
  });

  const formattedTime = useMemo(
    () => formatShortRelativeTime(message.createdAt),
    [message.createdAt]
  );

  return (
    <Box
      display="flex"
      justifyContent={isSelf ? 'end' : 'start'}
      marginBottom={2}
    >
      <Box
        maxWidth="65%"
        padding={3}
        rounding={3}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: isSelf ? '#d9fdd3' : '#ffffff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Flex direction="column" gap={1}>
          {/* Image content */}
          {message.type === 'IMAGE' && imageData?.url && (
            <Box marginBottom={2}>
              <Mask rounding={2}>
                <img
                  src={imageData.url}
                  alt="Attachment"
                  style={{
                    maxWidth: 200,
                    maxHeight: 300,
                    objectFit: 'contain',
                    cursor: 'pointer',
                  }}
                />
              </Mask>
            </Box>
          )}

          {/* Text content */}
          {message.content && (
            <Text size="200" overflow="breakWord">
              {message.content}
            </Text>
          )}

          {/* Time and status */}
          <Flex alignItems="center" justifyContent="end" gap={1}>
            <Text size="100" color="subtle">
              {formattedTime}
            </Text>
            {isSelf && <MessageStateIcon state={message.state} />}
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

export default MessageItem;