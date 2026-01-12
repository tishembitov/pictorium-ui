// src/modules/chat/components/MessageInput.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Flex, IconButton, TextArea } from 'gestalt';
import { EmojiPicker, AttachmentButton } from '@/shared/components';
import { useImageUpload } from '@/modules/storage';
import { useSendMessage } from '../hooks/useSendMessage';
import { useChatContext } from '@/app/providers'; // 👈 Изменено

interface MessageInputProps {
  chatId: string;
  onSend?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ chatId, onSend }) => {
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false); 
  const { sendMessage, sendImage, isLoading } = useSendMessage();
  const { sendTyping } = useChatContext(); // 👈 Изменено
  const { upload, isUploading } = useImageUpload();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        sendTyping(chatId, false);
      }
    };
  }, [chatId, sendTyping]);

  const handleChange = useCallback(
    ({ value }: { value: string }) => {
      setContent(value);

      if (!value.trim()) {
        if (isTypingRef.current) {
          sendTyping(chatId, false);
          isTypingRef.current = false;
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        return;
      }

      if (!isTypingRef.current) {
        sendTyping(chatId, true);
        isTypingRef.current = true;
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(chatId, false);
        isTypingRef.current = false;
        typingTimeoutRef.current = null;
      }, 2000);
    },
    [chatId, sendTyping]
  );

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      sendTyping(chatId, false);
      isTypingRef.current = false;
    }

    try {
      sendMessage(chatId, trimmed);
      setContent('');
      onSend?.();
    } catch {
      // Error handled silently
    }
  }, [content, chatId, isLoading, sendMessage, sendTyping, onSend]);

  const handleKeyDown = useCallback(
    ({ event }: { event: React.KeyboardEvent<HTMLTextAreaElement>; value: string }) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    setContent((prev) => prev + emoji);
  }, []);

  const handleFileSelect = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      try {
        const result = await upload(file, { category: 'chat' });
        sendImage(chatId, result.imageId);
        onSend?.();
      } catch {
        // Error handled silently
      }
    },
    [chatId, upload, sendImage, onSend]
  );

  const isSending = isLoading || isUploading;

  return (
    <Box color="secondary" padding={2}>
      <Flex alignItems="end" gap={2}>
        <AttachmentButton
          onFileSelect={handleFileSelect}
          accept="image/*"
          disabled={isSending}
        />

        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          disabled={isSending}
        />

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