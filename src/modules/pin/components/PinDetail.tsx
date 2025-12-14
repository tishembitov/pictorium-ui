// src/modules/pin/components/PinDetail.tsx

import React from 'react';
import { Box, Flex, Divider, Spinner, Text } from 'gestalt';
import { PinDetailHeader } from './PinDetailHeader';
import { PinDetailImage } from './PinDetailImage';
import { PinDetailActions } from './PinDetailActions';
import { PinStats } from './PinStats';
import { TagList } from '@/modules/tag';
import { CommentList } from '@/modules/comment';
import { UserCard, useUser} from '@/modules/user';
import { usePin } from '../hooks/usePin';
import { useCreateComment } from '../hooks/useCreateComment';
import type { CommentCreateRequest } from '@/modules/comment';
import { useInfinitePinComments } from '../hooks/usePinComments';

interface PinDetailProps {
  pinId: string;
}

export const PinDetail: React.FC<PinDetailProps> = ({ pinId }) => {
  const { pin, isLoading, isError, error } = usePin(pinId);
  const { user: author } = useUser(pin?.userId);
  
  const {
    comments,
    totalElements: commentCount,
    isLoading: isLoadingComments,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePinComments(pinId, { enabled: !!pin });

  const { createComment, isLoading: isCreatingComment } = useCreateComment(pinId);

  const handleCreateComment = (data: CommentCreateRequest) => {
    createComment(data);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={12}>
        <Spinner accessibilityLabel="Loading pin" show />
      </Box>
    );
  }

  if (isError || !pin) {
    return (
      <Box padding={8}>
        <Text color="error" align="center">
          {error?.message || 'Failed to load pin'}
        </Text>
      </Box>
    );
  }

  return (
    <Box maxWidth={1200} marginStart="auto" marginEnd="auto">
      <Flex gap={6} wrap>
        {/* Image Section */}
        <Box minWidth={300} flex="grow" maxWidth={600}>
          <PinDetailImage pin={pin} />
        </Box>

        {/* Content Section */}
        <Box minWidth={300} flex="grow">
          <Flex direction="column" gap={4}>
            {/* Header with actions */}
            <PinDetailHeader pin={pin} />

            {/* Actions */}
            <PinDetailActions pin={pin} />

            <Divider />

            {/* Title and Description */}
            {pin.title && (
              <Text size="600" weight="bold">
                {pin.title}
              </Text>
            )}

            {pin.description && (
              <Text color="subtle">{pin.description}</Text>
            )}

            {/* External Link */}
            {pin.href && (
              <Box>
                <a
                  href={pin.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Text color="link" underline>
                    Visit site
                  </Text>
                </a>
              </Box>
            )}

            {/* Tags */}
            {pin.tags.length > 0 && (
              <Box>
                <TagList tags={pin.tags} navigateOnClick size="sm" />
              </Box>
            )}

            <Divider />

            {/* Stats */}
            <PinStats pin={pin} />

            <Divider />

            {/* Author */}
            {author && (
              <Box>
                <Text size="200" weight="bold" color="subtle">
                  Created by
                </Text>
                <Box marginTop={2}>
                  <UserCard user={author} showFollowButton size="sm" />
                </Box>
              </Box>
            )}

            <Divider />

            {/* Comments */}
            <Box>
              <CommentList
                comments={comments}
                isLoading={isLoadingComments}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
                onCreateComment={handleCreateComment}
                isCreating={isCreatingComment}
                totalCount={commentCount}
              />
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default PinDetail;