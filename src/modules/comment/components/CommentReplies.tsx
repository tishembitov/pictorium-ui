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
      <Box display="flex" justifyContent="center" padding={4}>
        <Spinner accessibilityLabel="Loading replies" show size="sm" />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box padding={2}>
        <Text color="error" size="100">
          Failed to load replies
        </Text>
      </Box>
    );
  }

  if (replies.length === 0) {
    return null;
  }

  return (
    <Box marginStart={4}>
      <InfiniteScroll
        loadMore={() => fetchNextPage()}
        hasMore={hasNextPage ?? false}
        isLoading={isFetchingNextPage}
      >
        <Flex direction="column" gap={1}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              showReplies={false}
              isReply
            />
          ))}
        </Flex>
      </InfiniteScroll>
    </Box>
  );
};

export default CommentReplies;