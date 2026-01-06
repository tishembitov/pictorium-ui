// src/modules/pin/components/detail/PinDetailComments.tsx

import React, { useRef, useCallback } from 'react';
import { Box } from 'gestalt';
import { CommentList, type CommentCreateRequest } from '@/modules/comment';
import { useInfinitePinComments } from '../../hooks/usePinComments';
import { useCreateComment } from '../../hooks/useCreateComment';

interface PinDetailCommentsProps {
  pinId: string;
  commentsRef?: React.RefObject<HTMLDivElement | null>;
}

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
    <Box 
      ref={ref}
      paddingY={4}
      dangerouslySetInlineStyle={{
        __style: {
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      <CommentList
        comments={comments}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={handleFetchNextPage}
        onCreateComment={handleCreateComment}
        isCreating={isCreatingComment}
        totalCount={totalElements}
        emptyMessage="No comments yet"
      />
    </Box>
  );
};

export default PinDetailComments;