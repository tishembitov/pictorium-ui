// src/modules/comment/components/CommentItemActions.tsx

import React, { useCallback } from 'react';
import { Flex, IconButton, Text, TapArea, Tooltip } from 'gestalt';
import { useLikeComment } from '../hooks/useLikeComment';
import { useUnlikeComment } from '../hooks/useUnlikeComment';
import { useAuth } from '@/modules/auth';
import { formatCompactNumber } from '@/shared/utils/formatters';

interface CommentItemActionsProps {
  commentId: string;
  pinId?: string;
  parentId?: string;
  /** Контролируемое состояние лайка */
  isLiked: boolean;
  /** Контролируемый счётчик */
  likeCount: number;
  replyCount: number;
  isOwner: boolean;
  canReply?: boolean;
  /** Callback для обновления состояния */
  onToggleLike: () => boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CommentItemActions: React.FC<CommentItemActionsProps> = ({
  commentId,
  pinId,
  parentId,
  isLiked,
  likeCount,
  replyCount,
  isOwner,
  canReply = false,
  onToggleLike,
  onReply,
  onEdit,
  onDelete,
}) => {
  const { isAuthenticated, login } = useAuth();

  const { likeComment, isLoading: isLiking } = useLikeComment({
    pinId,
    parentId,
    onError: () => {
      // Revert on error
      onToggleLike();
    },
  });

  const { unlikeComment, isLoading: isUnliking } = useUnlikeComment({
    pinId,
    parentId,
    onError: () => {
      // Revert on error
      onToggleLike();
    },
  });

  const isLoading = isLiking || isUnliking;

  const handleLikeToggle = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    // 1. Immediate UI update (parent updates state)
    const newIsLiked = onToggleLike();

    // 2. Background mutation
    if (newIsLiked) {
      likeComment(commentId);
    } else {
      unlikeComment(commentId);
    }
  }, [isAuthenticated, login, onToggleLike, likeComment, unlikeComment, commentId]);

  return (
    <Flex alignItems="center" gap={4}>
      {/* Like button */}
      <Flex alignItems="center" gap={1}>
        <TapArea onTap={handleLikeToggle} disabled={isLoading}>
          <Flex alignItems="center" gap={1}>
            <IconButton
              accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
              icon="heart"
              size="xs"
              bgColor="transparent"
              iconColor={isLiked ? 'red' : 'gray'}
              disabled={isLoading}
            />
            {likeCount > 0 && (
              <Text size="100" color="subtle">
                {formatCompactNumber(likeCount)}
              </Text>
            )}
          </Flex>
        </TapArea>
      </Flex>

      {/* Reply button - показываем только если canReply */}
      {canReply && onReply && (
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

      {/* Reply count for replies (без кнопки) */}
      {!canReply && replyCount > 0 && (
        <Text size="100" color="subtle">
          {formatCompactNumber(replyCount)} {replyCount === 1 ? 'reply' : 'replies'}
        </Text>
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