// src/modules/chat/components/MessageInput.tsx

import React, { useState, useCallback, useRef } from 'react';
import { Box, Flex, IconButton, TextArea } from 'gestalt';
import { EmojiPicker, AttachmentButton } from '@/shared/components';
import { useImageUpload } from '@/modules/storage';
import { useSendMessage } from '../hooks/useSendMessage';
import { useChatWebSocket } from '../hooks/useChatWebSocket';

interface MessageInputProps {
  chatId: string;
  onSend?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ chatId, onSend }) => {
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { sendMessage, sendImage, isLoading } = useSendMessage();
  const { sendTyping } = useChatWebSocket();
  const { upload, isUploading } = useImageUpload();

  // Handle text change with typing indicator
  const handleChange = useCallback(
    ({ value }: { value: string }) => {
      setContent(value);

      // Send typing indicator
      sendTyping(chatId, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(chatId, false);
      }, 2000);
    },
    [chatId, sendTyping]
  );

  // Handle send message
  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    try {
      sendMessage(chatId, trimmed);
      setContent('');
      sendTyping(chatId, false);
      onSend?.();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [content, chatId, isLoading, sendMessage, sendTyping, onSend]);

  // Handle key press
  const handleKeyDown = useCallback(
    ({ event }: { event: React.KeyboardEvent<HTMLTextAreaElement>; value: string }) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Handle emoji select
  const handleEmojiSelect = useCallback((emoji: string) => {
    setContent((prev) => prev + emoji);
  }, []);

  // Handle file attachment
  const handleFileSelect = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      try {
        const result = await upload(file, { category: 'chat' });
        sendImage(chatId, result.imageId);
        onSend?.();
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    },
    [chatId, upload, sendImage, onSend]
  );

  const isSending = isLoading || isUploading;

  return (
    <Box color="secondary" padding={2}>
      <Flex alignItems="end" gap={2}>
        {/* Attachment button */}
        <AttachmentButton
          onFileSelect={handleFileSelect}
          accept="image/*"
          disabled={isSending}
        />

        {/* Emoji picker */}
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          disabled={isSending}
        />

        {/* Text input */}
        <Box flex="grow">
          <TextArea
            id="message-input"
            placeholder="Type a message"
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isSending}
          />
        </Box>

        {/* Send button */}
        {content.trim() ? (
          <IconButton
            accessibilityLabel="Send message"
            icon="send"
            onClick={handleSend}
            disabled={isSending}
            bgColor="red"
            iconColor="white"
          />
        ) : (
          <IconButton
            accessibilityLabel="Voice message"
            icon="microphone"
            disabled
            bgColor="transparent"
          />
        )}
      </Flex>
    </Box>
  );
};

export default MessageInput;