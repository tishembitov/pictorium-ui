// src/modules/comment/components/CommentItem.tsx

import React, { useState, useCallback } from 'react';
import { Box, Flex, Text, TapArea, Icon } from 'gestalt';
import { Link } from 'react-router-dom';
import { UserAvatar, useUser } from '@/modules/user';
import { ImagePreview } from '@/modules/storage';
import { useAuth, useIsOwner } from '@/modules/auth';
import { useConfirmModal } from '@/shared/hooks/useConfirmModal';
import { buildPath } from '@/app/router/routeConfig';
import { formatShortRelativeTime } from '@/shared/utils/formatters';
import { CommentItemActions } from './CommentItemActions';
import { CommentForm } from './CommentForm';
import { ReplyForm } from './ReplyForm';
import { CommentReplies } from './CommentReplies';
import { useCommentLocalState } from '../hooks/useCommentLocalState';
import { useUpdateComment } from '../hooks/useUpdateComment';
import { useDeleteComment } from '../hooks/useDeleteComment';
import type { CommentResponse } from '../types/comment.types';

// ============ Sub-components ============

interface CommentHeaderProps {
  profilePath: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  isReply: boolean;
}

const CommentHeader: React.FC<CommentHeaderProps> = ({
  profilePath,
  username,
  createdAt,
  updatedAt,
  isReply,
}) => {
  const isEdited = updatedAt !== createdAt;

  return (
    <Flex alignItems="center" gap={2} wrap>
      <Link to={profilePath} style={{ textDecoration: 'none' }}>
        <Text weight="bold" size={isReply ? '100' : '200'}>
          {username}
        </Text>
      </Link>
      <Text color="subtle" size="100">•</Text>
      <Text color="subtle" size="100">
        {formatShortRelativeTime(createdAt)}
      </Text>
      {isEdited && (
        <Text color="subtle" size="100" italic>
          (edited)
        </Text>
      )}
    </Flex>
  );
};

interface CommentContentProps {
  content: string | null;
  imageId: string | null;
  isReply: boolean;
}

const CommentContent: React.FC<CommentContentProps> = ({
  content,
  imageId,
  isReply,
}) => (
  <>
    {content && (
      <Box marginTop={1}>
        <Text size={isReply ? '100' : '200'} overflow="breakWord">
          {content}
        </Text>
      </Box>
    )}

    {imageId && (
      <Box
        marginTop={3}
        maxWidth={280}
        rounding={3}
        overflow="hidden"
        dangerouslySetInlineStyle={{
          __style: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' },
        }}
      >
        <ImagePreview imageId={imageId} alt="Comment image" rounding={3} />
      </Box>
    )}
  </>
);

interface RepliesToggleProps {
  replyCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const RepliesToggle: React.FC<RepliesToggleProps> = ({
  replyCount,
  isExpanded,
  onToggle,
}) => {
  // ✅ Исправление S3358: убираем вложенный тернарный оператор
  const getToggleText = (): string => {
    if (isExpanded) {
      return 'Hide replies';
    }
    const replyWord = replyCount === 1 ? 'reply' : 'replies';
    return `${replyCount} ${replyWord}`;
  };

  return (
    <Box marginTop={3}>
      <TapArea onTap={onToggle} rounding={2}>
        <Box
          paddingY={1}
          paddingX={2}
          rounding={2}
          display="inlineBlock"
          dangerouslySetInlineStyle={{
            __style: {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              transition: 'all 0.15s ease',
            },
          }}
        >
          <Flex alignItems="center" gap={1}>
            <Icon
              accessibilityLabel=""
              icon={isExpanded ? 'arrow-up' : 'arrow-down'}
              size={10}
              color="subtle"
            />
            <Text size="100" color="subtle">
              {getToggleText()}
            </Text>
          </Flex>
        </Box>
      </TapArea>
    </Box>
  );
};

// ============ Main Component ============

interface CommentItemProps {
  comment: CommentResponse;
  showReplies?: boolean;
  isReply?: boolean;
  onDeleted?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  showReplies = true,
  isReply = false,
  onDeleted,
}) => {
  const { isAuthenticated, user: currentUser } = useAuth();
  const isOwner = useIsOwner(comment.userId);
  const { confirm } = useConfirmModal();
  const { user: commentAuthor } = useUser(comment.userId);

  const { state: localState, toggleLike, incrementReplyCount } = useCommentLocalState(comment);

  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showRepliesSection, setShowRepliesSection] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { updateComment, isLoading: isUpdating } = useUpdateComment({
    onSuccess: () => setIsEditing(false),
  });

  const { deleteComment } = useDeleteComment({
    pinId: comment.pinId,
    parentCommentId: comment.parentCommentId || undefined,
    onSuccess: () => {
      setIsDeleting(false);
      onDeleted?.();
    },
    onError: () => setIsDeleting(false),
  });

  // Memoized values
  const authorUsername = commentAuthor?.username || 'Unknown';
  const authorImageId = commentAuthor?.imageId || null;
  const profilePath = commentAuthor?.username
    ? buildPath.profile(commentAuthor.username)
    : '#';
  const isOwnComment = currentUser?.id === comment.userId;
  const canReply = !isReply && !isOwnComment && isAuthenticated;
  const hasReplies = localState.replyCount > 0;
  const showRepliesToggle = showReplies && !isReply && hasReplies;

  // Handlers
  const handleEdit = useCallback(() => setIsEditing(true), []);
  const handleCancelEdit = useCallback(() => setIsEditing(false), []);

  const handleUpdate = useCallback(
    (data: { content?: string; imageId?: string }) => {
      updateComment({ commentId: comment.id, data });
    },
    [comment.id, updateComment]
  );

  const handleDelete = useCallback(() => {
    confirm({
      title: 'Delete comment?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => {
        setIsDeleting(true);
        deleteComment(comment.id);
      },
    });
  }, [comment.id, deleteComment, confirm]);

  const handleReply = useCallback(() => {
    if (isAuthenticated) {
      setIsReplying(true);
    }
  }, [isAuthenticated]);

  const handleCancelReply = useCallback(() => setIsReplying(false), []);

  const handleReplySuccess = useCallback(() => {
    setIsReplying(false);
    setShowRepliesSection(true);
    incrementReplyCount();
  }, [incrementReplyCount]);

  const toggleRepliesSection = useCallback(() => {
    setShowRepliesSection(prev => !prev);
  }, []);

  // Early returns
  if (localState.isDeleted) {
    return null;
  }

  if (isEditing) {
    return (
      <Box paddingY={2}>
        <CommentForm
          onSubmit={handleUpdate}
          isLoading={isUpdating}
          onCancel={handleCancelEdit}
          initialContent={comment.content || ''}
          initialImageId={comment.imageId || ''}
          showAvatar={false}
          autoFocus
        />
      </Box>
    );
  }

  return (
    <Box
      paddingY={3}
      paddingX={3}
      rounding={3}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      dangerouslySetInlineStyle={{
        __style: {
          opacity: isDeleting ? 0.5 : 1,
          backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
          transition: 'all 0.15s ease',
          marginLeft: isReply ? 24 : 0,
          borderLeft: isReply ? '2px solid rgba(0, 0, 0, 0.08)' : 'none',
        },
      }}
    >
      <Flex gap={3} alignItems="start">
        {/* Avatar */}
        <Link to={profilePath} style={{ flexShrink: 0 }}>
          <Box
            dangerouslySetInlineStyle={{
              __style: {
                transition: 'transform 0.15s ease',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              },
            }}
          >
            <UserAvatar
              imageId={authorImageId}
              name={authorUsername}
              size={isReply ? 'xs' : 'sm'}
            />
          </Box>
        </Link>

        {/* Content */}
        <Box flex="grow">
          <CommentHeader
            profilePath={profilePath}
            username={authorUsername}
            createdAt={comment.createdAt}
            updatedAt={comment.updatedAt}
            isReply={isReply}
          />

          <CommentContent
            content={comment.content}
            imageId={comment.imageId}
            isReply={isReply}
          />

          {/* Actions */}
          <Box marginTop={2}>
            <CommentItemActions
              commentId={comment.id}
              pinId={comment.pinId}
              parentId={comment.parentCommentId || undefined}
              isLiked={localState.isLiked}
              likeCount={localState.likeCount}
              isOwner={isOwner}
              canReply={canReply}
              onToggleLike={toggleLike}
              onReply={canReply ? handleReply : undefined}
              onEdit={isOwner ? handleEdit : undefined}
              onDelete={isOwner ? handleDelete : undefined}
              showActionsOnHover={isHovered}
            />
          </Box>

          {/* Reply form */}
          {isReplying && (
            <Box marginTop={3}>
              <ReplyForm
                commentId={comment.id}
                pinId={comment.pinId}
                onSuccess={handleReplySuccess}
                onCancel={handleCancelReply}
              />
            </Box>
          )}

          {/* Replies toggle */}
          {showRepliesToggle && (
            <RepliesToggle
              replyCount={localState.replyCount}
              isExpanded={showRepliesSection}
              onToggle={toggleRepliesSection}
            />
          )}

          {/* Replies section */}
          {showReplies && !isReply && showRepliesSection && (
            <Box marginTop={3}>
              <CommentReplies commentId={comment.id} />
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default CommentItem;