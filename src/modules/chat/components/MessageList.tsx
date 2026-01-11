// src/modules/chat/components/MessageList.tsx

import React, { useRef, useEffect, useCallback } from 'react';
import { Box, Spinner, Text, Flex } from 'gestalt';
import { useAuth } from '@/modules/auth';
import { useMessages } from '../hooks/useMessages';
import { MessageItem } from './MessageItem';
import { formatDate } from '@/shared/utils/formatters';

interface MessageListProps {
  chatId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ chatId }) => {
  const { userId } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(0);

  const {
    messages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMessages(chatId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLength.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  // Handle scroll to load more
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isFetchingNextPage || !hasNextPage) return;

    // Load more when scrolled near top
    if (scrollRef.current.scrollTop < 100) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: typeof messages }[] = [];
    let currentDate = '';

    messages.forEach((msg) => {
      const msgDate = formatDate(msg.createdAt, 'yyyy-MM-dd');
      if (msgDate === currentDate) {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup) {
          lastGroup.messages.push(msg);
        }
      } else {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      }
    });

    return groups;
  }, [messages]);

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <Spinner accessibilityLabel="Loading messages" show />
      </Box>
    );
  }

  if (messages.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <Text color="subtle">No messages yet. Start the conversation!</Text>
      </Box>
    );
  }

  return (
    <Box
      ref={scrollRef}
      height="100%"
      overflow="auto"
      padding={3}
      onScroll={handleScroll}
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: '#efeae2',
          backgroundImage: 'url("/wa_bg.png")',
          backgroundSize: 'contain',
        },
      }}
    >
      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <Box display="flex" justifyContent="center" padding={2}>
          <Spinner accessibilityLabel="Loading more" show size="sm" />
        </Box>
      )}

      {groupedMessages.map((group) => (
        <React.Fragment key={group.date}>
          {/* Date separator */}
          <Box marginBottom={3}>
            <Flex justifyContent="center">
              <Box
                paddingX={3}
                paddingY={1}
                rounding="pill"
                color="secondary"
              >
                <Text size="100" color="subtle">
                  {formatDate(group.date, 'MMMM d, yyyy')}
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* Messages for this date */}
          {group.messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isSelf={message.senderId === userId}
            />
          ))}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default MessageList;