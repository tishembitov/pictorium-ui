// src/modules/comment/components/CommentReplies.tsx

import React from 'react';
import { Box, Flex, Spinner, Text } from 'gestalt';
import { CommentItem } from './CommentItem';
import { InfiniteScroll } from '@/shared/components';
import { useInfiniteCommentReplies } from '../hooks/useCommentReplies';

interface CommentRepliesProps {
  commentId: string;
}

export const CommentReplies: React.FC<CommentRepliesProps> = ({
  commentId,
}) => {
  const {
    replies,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteCommentReplies(commentId);

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        padding={4}
        marginStart={6}
      >
        <Flex alignItems="center" gap={2}>
          <Spinner accessibilityLabel="Loading replies" show size="sm" />
          <Text color="subtle" size="100">Loading replies...</Text>
        </Flex>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box 
        padding={3} 
        marginStart={6}
        rounding={2}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: 'rgba(255, 0, 0, 0.05)',
          },
        }}
      >
        <Flex alignItems="center" gap={2}>
          <Text size="200">⚠️</Text>
          <Text color="error" size="100">
            Failed to load replies. Try again later.
          </Text>
        </Flex>
      </Box>
    );
  }

  if (replies.length === 0) {
    return null;
  }

  return (
    <Box
      dangerouslySetInlineStyle={{
        __style: {
          borderLeft: '2px solid rgba(0, 0, 0, 0.06)',
          marginLeft: 8,
          paddingLeft: 8,
        },
      }}
    >
      <InfiniteScroll
        loadMore={() => fetchNextPage()}
        hasMore={hasNextPage ?? false}
        isLoading={isFetchingNextPage}
        loader={
          <Box padding={2} display="flex" justifyContent="center">
            <Spinner accessibilityLabel="Loading more replies" show size="sm" />
          </Box>
        }
      >
        <Flex direction="column" gap={0}>
          {replies.map((reply, index) => (
            <Box
              key={reply.id}
              dangerouslySetInlineStyle={{
                __style: {
                  animation: `slideIn 0.2s ease ${index * 0.03}s both`,
                },
              }}
            >
              <CommentItem
                comment={reply}
                showReplies={false}
                isReply
              />
            </Box>
          ))}
        </Flex>
      </InfiniteScroll>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default CommentReplies;