// src/modules/pin/components/detail/PinDetailComments.tsx

import React, { useRef, useCallback } from 'react';
import { Box, Text, Divider } from 'gestalt';
import { CommentList, type CommentCreateRequest } from '@/modules/comment';
import { useInfinitePinComments } from '../../hooks/usePinComments';
import { useCreateComment } from '../../hooks/useCreateComment';

interface PinDetailCommentsProps {
  pinId: string;
  commentsRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Секция комментариев пина.
 * Ответственность: загрузка, отображение и создание комментариев.
 */
export const PinDetailComments: React.FC<PinDetailCommentsProps> = ({
  pinId,
  commentsRef,
}) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = commentsRef ?? internalRef;

  const {
    comments,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePinComments(pinId);

  const { createComment, isLoading: isCreatingComment } = useCreateComment(pinId);

  const handleCreateComment = useCallback(
    (data: CommentCreateRequest) => {
      createComment(data);
    },
    [createComment]
  );

  const handleFetchNextPage = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  return (
    <Box ref={ref}>
      {/* Header */}
      <Box paddingY={3}>
        <Text weight="bold" size="400">
          Comments
          {totalElements > 0 && (
            <Text inline color="subtle">
              {' '}
              ({totalElements})
            </Text>
          )}
        </Text>
      </Box>

      <Divider />

      {/* Comments List */}
      <Box paddingY={3}>
        <CommentList
          comments={comments}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={handleFetchNextPage}
          onCreateComment={handleCreateComment}
          isCreating={isCreatingComment}
          totalCount={totalElements}
          emptyMessage="No comments yet. Be the first!"
        />
      </Box>
    </Box>
  );
};

export default PinDetailComments;