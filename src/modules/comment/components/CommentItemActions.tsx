// src/modules/comment/components/CommentItemActions.tsx

import React, { useCallback } from 'react';
import { Flex, TapArea, Text, Box } from 'gestalt';
import { useLikeComment } from '../hooks/useLikeComment';
import { useUnlikeComment } from '../hooks/useUnlikeComment';
import { useAuth } from '@/modules/auth';
import { formatCompactNumber } from '@/shared/utils/formatters';

interface CommentItemActionsProps {
  commentId: string;
  pinId?: string;
  parentId?: string;
  isLiked: boolean;
  likeCount: number;
  isOwner: boolean;
  canReply?: boolean;
  onToggleLike: () => boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActionsOnHover?: boolean;
}

interface ActionButtonProps {
  emoji: string;
  label: string;
  count?: number;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  emoji,
  label,
  count,
  isActive = false,
  onClick,
  disabled = false,
}) => (
  <TapArea onTap={onClick} disabled={disabled} rounding={2} tapStyle="compress">
    <Box
      paddingY={1}
      paddingX={2}
      rounding={2}
      display="flex"
      alignItems="center"
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: isActive ? 'rgba(230, 0, 35, 0.1)' : 'transparent',
          transition: 'all 0.15s ease',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        },
      }}
    >
      <Flex alignItems="center" gap={1}>
        <Text size="200">{emoji}</Text>
        {count !== undefined && count > 0 && (
          <Text 
            size="100" 
            weight="bold"
            color={isActive ? 'default' : 'subtle'}
          >
            {formatCompactNumber(count)}
          </Text>
        )}
        <Text 
          size="100" 
          color={isActive ? 'default' : 'subtle'}
        >
          {label}
        </Text>
      </Flex>
    </Box>
  </TapArea>
);

export const CommentItemActions: React.FC<CommentItemActionsProps> = ({
  commentId,
  pinId,
  parentId,
  isLiked,
  likeCount,
  isOwner,
  canReply = false,
  onToggleLike,
  onReply,
  onEdit,
  onDelete,
  showActionsOnHover = false,
}) => {
  const { isAuthenticated, login } = useAuth();

  const { likeComment, isLoading: isLiking } = useLikeComment({
    pinId,
    parentId,
    onError: () => onToggleLike(),
  });

  const { unlikeComment, isLoading: isUnliking } = useUnlikeComment({
    pinId,
    parentId,
    onError: () => onToggleLike(),
  });

  const isLoading = isLiking || isUnliking;

  const handleLikeToggle = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    const newIsLiked = onToggleLike();

    if (newIsLiked) {
      likeComment(commentId);
    } else {
      unlikeComment(commentId);
    }
  }, [isAuthenticated, login, onToggleLike, likeComment, unlikeComment, commentId]);

  return (
    <Flex alignItems="center" gap={1} wrap>
      {/* Like */}
      <ActionButton
        emoji={isLiked ? '❤️' : '🤍'}
        label={isLiked ? 'Liked' : 'Like'}
        count={likeCount}
        isActive={isLiked}
        onClick={handleLikeToggle}
        disabled={isLoading}
      />

      {/* Reply */}
      {canReply && onReply && (
        <ActionButton
          emoji="💬"
          label="Reply"
          onClick={onReply}
        />
      )}

      {/* Owner actions */}
      {isOwner && (
        <Box
          dangerouslySetInlineStyle={{
            __style: {
              opacity: showActionsOnHover ? 1 : 0.6,
              transition: 'opacity 0.15s ease',
            },
          }}
        >
          <Flex gap={1}>
            {onEdit && (
              <ActionButton
                emoji="✏️"
                label="Edit"
                onClick={onEdit}
              />
            )}
            {onDelete && (
              <ActionButton
                emoji="🗑️"
                label="Delete"
                onClick={onDelete}
              />
            )}
          </Flex>
        </Box>
      )}
    </Flex>
  );
};

export default CommentItemActions;