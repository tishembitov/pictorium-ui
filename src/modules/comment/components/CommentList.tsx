// src/modules/comment/components/CommentList.tsx

import React from 'react';
import { Box, Flex, Spinner, Text, Heading } from 'gestalt';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { InfiniteScroll } from '@/shared/components';
import { useAuth } from '@/modules/auth';
import { formatCompactNumber } from '@/shared/utils/formatters';
import type { CommentResponse, CommentCreateRequest } from '../types/comment.types';

interface CommentListProps {
  comments: CommentResponse[];
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  onCreateComment?: (data: CommentCreateRequest) => void;
  isCreating?: boolean;
  totalCount?: number;
  emptyMessage?: string;
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  isLoading,
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
  onCreateComment,
  isCreating = false,
  totalCount,
  emptyMessage = 'No comments yet',
}) => {
  const { isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={8}>
        <Flex direction="column" alignItems="center" gap={3}>
          <Spinner accessibilityLabel="Loading comments" show />
          <Text color="subtle" size="200">Loading comments...</Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box marginBottom={4}>
        <Flex alignItems="center" gap={2}>
          <Text size="100">💬</Text>
          <Heading size="400">
            Comments
          </Heading>
          {totalCount !== undefined && totalCount > 0 && (
            <Box 
              paddingX={2} 
              paddingY={1} 
              rounding="pill"
              color="secondary"
            >
              <Text size="100" weight="bold">
                {formatCompactNumber(totalCount)}
              </Text>
            </Box>
          )}
        </Flex>
      </Box>

      {/* Comment form */}
      {onCreateComment && (
        <Box marginBottom={5}>
          <CommentForm
            onSubmit={onCreateComment}
            isLoading={isCreating}
            showAvatar={isAuthenticated}
            placeholder="Share your thoughts..."
          />
        </Box>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <Box paddingY={5}>
          <Flex direction="column" alignItems="center" gap={2}>
            <Text size="300">💬</Text>
            <Text align="center" color="subtle" size="200">
              {emptyMessage}
            </Text>
          </Flex>
        </Box>
      ) : (
        <InfiniteScroll
          loadMore={() => fetchNextPage?.()}
          hasMore={hasNextPage}
          isLoading={isFetchingNextPage}
          loader={
            <Box padding={4} display="flex" justifyContent="center">
              <Spinner accessibilityLabel="Loading more" show size="sm" />
            </Box>
          }
        >
          <Flex direction="column" gap={1}>
            {comments.map((comment, index) => (
              <Box 
                key={comment.id}
                dangerouslySetInlineStyle={{
                  __style: {
                    animation: `fadeIn 0.3s ease ${index * 0.05}s both`,
                  },
                }}
              >
                <CommentItem comment={comment} />
              </Box>
            ))}
          </Flex>
        </InfiniteScroll>
      )}

      {/* Load more indicator */}
      {hasNextPage && !isFetchingNextPage && (
        <Box marginTop={4} display="flex" justifyContent="center">
          <Text color="subtle" size="100">
            Scroll for more comments ↓
          </Text>
        </Box>
      )}

      {/* CSS Animation */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default CommentList;