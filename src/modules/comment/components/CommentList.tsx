// src/modules/comment/components/CommentList.tsx

import React from 'react';
import { Box, Flex, Spinner, Text, Divider } from 'gestalt';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { InfiniteScroll, EmptyState } from '@/shared/components';
import { useAuth } from '@/modules/auth';
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
  emptyMessage = 'No comments yet. Be the first to comment!',
}) => {
  const { isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={6}>
        <Spinner accessibilityLabel="Loading comments" show />
      </Box>
    );
  }

  return (
    <Box>
      {/* Comment count */}
      {totalCount !== undefined && totalCount > 0 && (
        <Box marginBottom={4}>
          <Text weight="bold" size="300">
            {totalCount} {totalCount === 1 ? 'Comment' : 'Comments'}
          </Text>
        </Box>
      )}

      {/* Comment form */}
      {onCreateComment && (
        <Box marginBottom={4}>
          <CommentForm
            onSubmit={onCreateComment}
            isLoading={isCreating}
            showAvatar={isAuthenticated}
          />
          <Box marginTop={4}>
            <Divider />
          </Box>
        </Box>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <EmptyState
          title={emptyMessage}
          icon="speech"
        />
      ) : (
        <InfiniteScroll
          loadMore={() => fetchNextPage?.()}
          hasMore={hasNextPage}
          isLoading={isFetchingNextPage}
        >
          <Flex direction="column" gap={1}>
            {comments.map((comment) => (
              <React.Fragment key={comment.id}>
                <CommentItem comment={comment} />
                <Box marginTop={2} marginBottom={2}>
                  <Divider />
                </Box>
              </React.Fragment>
            ))}
          </Flex>
        </InfiniteScroll>
      )}
    </Box>
  );
};

export default CommentList;