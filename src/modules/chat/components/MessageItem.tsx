// src/modules/chat/components/MessageItem.tsx

import React, { useMemo, useState } from 'react';
import { Box, Flex, Text, Icon, Mask, TapArea } from 'gestalt';
import { useImageUrl } from '@/modules/storage';
import { formatShortRelativeTime } from '@/shared/utils/formatters';
import type { MessageResponse, MessageState } from '../types/chat.types';

interface MessageItemProps {
  message: MessageResponse;
  isSelf: boolean;
  onImageClick?: (imageUrl: string) => void;
}

// ==================== Sub-components ====================

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

interface MessageTimeProps {
  time: string;
  isSelf: boolean;
  state: MessageState;
}

const MessageTime: React.FC<MessageTimeProps> = ({ time, isSelf, state }) => (
  <Flex alignItems="center" gap={1}>
    <Text size="100" color="subtle">
      {time}
    </Text>
    {isSelf && <MessageStateIcon state={state} />}
  </Flex>
);

interface ImagePlaceholderProps {
  isLoading: boolean;
  width: number;
  height: number;
}

const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({ isLoading, width, height }) => (
  <Box
    width={width}
    height={height}
    color="secondary"
    display="flex"
    alignItems="center"
    justifyContent="center"
  >
    {isLoading ? (
      <Text color="subtle">Loading...</Text>
    ) : (
      <Icon accessibilityLabel="Failed to load" icon="workflow-status-problem" color="subtle" />
    )}
  </Box>
);

interface ChatImageProps {
  imageUrl: string | undefined;
  isLoading: boolean;
  hasError: boolean;
  onError: () => void;
  onClick?: () => void;
  maxWidth: number;
  maxHeight: number;
  placeholderWidth: number;
  placeholderHeight: number;
}

const ChatImage: React.FC<ChatImageProps> = ({
  imageUrl,
  isLoading,
  hasError,
  onError,
  onClick,
  maxWidth,
  maxHeight,
  placeholderWidth,
  placeholderHeight,
}) => {
  const showPlaceholder = isLoading || hasError || !imageUrl;

  if (showPlaceholder) {
    return (
      <ImagePlaceholder
        isLoading={isLoading}
        width={placeholderWidth}
        height={placeholderHeight}
      />
    );
  }

  return (
    <TapArea onTap={onClick} rounding={3}>
      <img
        src={imageUrl}
        alt="Attachment"
        onError={onError}
        style={{
          display: 'block',
          maxWidth,
          maxHeight,
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          cursor: onClick ? 'pointer' : 'default',
        }}
      />
    </TapArea>
  );
};

// ==================== Main Component ====================

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isSelf,
  onImageClick,
}) => {
  const [imageError, setImageError] = useState(false);

  const isImageMessage = message.type === 'IMAGE' && !!message.imageId;
  const hasTextContent = !!message.content && message.content.trim().length > 0;

  const { data: imageData, isLoading: isImageLoading } = useImageUrl(message.imageId, {
    enabled: isImageMessage,
  });

  const formattedTime = useMemo(
    () => formatShortRelativeTime(message.createdAt),
    [message.createdAt]
  );

  const handleImageClick = () => {
    if (imageData?.url && onImageClick) {
      onImageClick(imageData.url);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Image-only message (no background bubble)
  if (isImageMessage && !hasTextContent) {
    return (
      <Box
        display="flex"
        justifyContent={isSelf ? 'end' : 'start'}
        marginBottom={2}
        paddingX={2}
      >
        <Box maxWidth={320}>
          <Mask rounding={3}>
            <ChatImage
              imageUrl={imageData?.url}
              isLoading={isImageLoading}
              hasError={imageError}
              onError={handleImageError}
              onClick={handleImageClick}
              maxWidth={320}
              maxHeight={400}
              placeholderWidth={280}
              placeholderHeight={200}
            />
          </Mask>

          <Box marginTop={1} display="flex" justifyContent={isSelf ? 'end' : 'start'}>
            <MessageTime time={formattedTime} isSelf={isSelf} state={message.state} />
          </Box>
        </Box>
      </Box>
    );
  }

  // Text message or image with caption
  return (
    <Box
      display="flex"
      justifyContent={isSelf ? 'end' : 'start'}
      marginBottom={2}
      paddingX={2}
    >
      <Box
        maxWidth="70%"
        padding={3}
        rounding={3}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: isSelf ? '#d9fdd3' : '#ffffff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Flex direction="column" gap={2}>
          {/* Image with caption */}
          {isImageMessage && (
            <Mask rounding={2}>
              <ChatImage
                imageUrl={imageData?.url}
                isLoading={isImageLoading}
                hasError={imageError}
                onError={handleImageError}
                onClick={handleImageClick}
                maxWidth={280}
                maxHeight={360}
                placeholderWidth={260}
                placeholderHeight={180}
              />
            </Mask>
          )}

          {/* Text content */}
          {hasTextContent && (
            <Text size="200" overflow="breakWord">
              {message.content}
            </Text>
          )}

          {/* Time and status */}
          <Flex justifyContent="end">
            <MessageTime time={formattedTime} isSelf={isSelf} state={message.state} />
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

export default MessageItem;