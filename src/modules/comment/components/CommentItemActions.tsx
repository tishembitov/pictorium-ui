// src/modules/comment/components/CommentItemActions.tsx

import React, { useState, useCallback } from 'react';
import { Flex, IconButton, Text, TapArea, Tooltip } from 'gestalt';
import { useLikeComment } from '../hooks/useLikeComment';
import { useUnlikeComment } from '../hooks/useUnlikeComment';
import { useAuth } from '@/modules/auth';
import { formatCompactNumber } from '@/shared/utils/formatters';

interface CommentItemActionsProps {
  commentId: string;
  isLiked: boolean;
  likeCount: number;
  replyCount: number;
  isOwner: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CommentItemActions: React.FC<CommentItemActionsProps> = ({
  commentId,
  isLiked,
  likeCount,
  replyCount,
  isOwner,
  onReply,
  onEdit,
  onDelete,
}) => {
  const { isAuthenticated, login } = useAuth();
  const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
  const [optimisticCount, setOptimisticCount] = useState(likeCount);

  const { likeComment, isLoading: isLiking } = useLikeComment({
    onSuccess: () => {
      setOptimisticLiked(true);
      setOptimisticCount((prev) => prev + 1);
    },
    onError: () => {
      // Revert on error
      setOptimisticLiked(isLiked);
      setOptimisticCount(likeCount);
    },
  });

  const { unlikeComment, isLoading: isUnliking } = useUnlikeComment({
    onSuccess: () => {
      setOptimisticLiked(false);
      setOptimisticCount((prev) => Math.max(0, prev - 1));
    },
    onError: () => {
      // Revert on error
      setOptimisticLiked(isLiked);
      setOptimisticCount(likeCount);
    },
  });

  // Sync with props
  React.useEffect(() => {
    setOptimisticLiked(isLiked);
    setOptimisticCount(likeCount);
  }, [isLiked, likeCount]);

  const handleLikeToggle = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (optimisticLiked) {
      unlikeComment(commentId);
    } else {
      likeComment(commentId);
    }
  }, [isAuthenticated, login, optimisticLiked, commentId, likeComment, unlikeComment]);

  const isLoading = isLiking || isUnliking;

  return (
    <Flex alignItems="center" gap={4}>
      {/* Like button */}
      <Flex alignItems="center" gap={1}>
        <TapArea onTap={handleLikeToggle} disabled={isLoading}>
          <Flex alignItems="center" gap={1}>
            <IconButton
              accessibilityLabel={optimisticLiked ? 'Unlike' : 'Like'}
              icon="heart"
              size="xs"
              bgColor="transparent"
              iconColor={optimisticLiked ? 'red' : 'gray'}
              disabled={isLoading}
            />
            {optimisticCount > 0 && (
              <Text size="100" color="subtle">
                {formatCompactNumber(optimisticCount)}
              </Text>
            )}
          </Flex>
        </TapArea>
      </Flex>

      {/* Reply button */}
      {onReply && (
        <TapArea onTap={onReply}>
          <Flex alignItems="center" gap={1}>
            <Text size="100" color="subtle" weight="bold">
              Reply
            </Text>
            {replyCount > 0 && (
              <Text size="100" color="subtle">
                ({formatCompactNumber(replyCount)})
              </Text>
            )}
          </Flex>
        </TapArea>
      )}

      {/* Owner actions */}
      {isOwner && (
        <Flex gap={2}>
          {onEdit && (
            <Tooltip text="Edit">
              <IconButton
                accessibilityLabel="Edit comment"
                icon="edit"
                size="xs"
                bgColor="transparent"
                onClick={onEdit}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip text="Delete">
              <IconButton
                accessibilityLabel="Delete comment"
                icon="trash-can"
                size="xs"
                bgColor="transparent"
                onClick={onDelete}
              />
            </Tooltip>
          )}
        </Flex>
      )}
    </Flex>
  );
};

export default CommentItemActions;