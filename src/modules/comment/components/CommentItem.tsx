// src/modules/comment/components/CommentItem.tsx

import React, { useState, useCallback } from 'react';
import { Box, Flex, Text, TapArea } from 'gestalt';
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
import { useUpdateComment } from '../hooks/useUpdateComment';
import { useDeleteComment } from '../hooks/useDeleteComment';
import type { CommentResponse } from '../types/comment.types';

interface CommentItemProps {
  comment: CommentResponse;
  showReplies?: boolean;
  isReply?: boolean;
  onDeleted?: () => void;
}

/**
 * Get reply toggle text
 */
const getReplyToggleText = (showRepliesSection: boolean, replyCount: number): string => {
  if (showRepliesSection) {
    return 'Hide replies';
  }
  
  const replyWord = replyCount === 1 ? 'reply' : 'replies';
  return `View ${replyCount} ${replyWord}`;
};

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

  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showRepliesSection, setShowRepliesSection] = useState(false);

  const { updateComment, isLoading: isUpdating } = useUpdateComment({
    onSuccess: () => setIsEditing(false),
  });

  const { deleteComment, isLoading: isDeleting } = useDeleteComment({
    pinId: comment.pinId,
    parentCommentId: comment.parentCommentId || undefined,
    onSuccess: onDeleted,
  });

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleUpdate = useCallback(
    (data: { content?: string; imageId?: string }) => {
      updateComment({
        commentId: comment.id,
        data,
      });
    },
    [comment.id, updateComment]
  );

  const handleDelete = useCallback(() => {
    confirm({
      title: 'Delete comment?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => deleteComment(comment.id),
    });
  }, [comment.id, deleteComment, confirm]);

  const handleReply = useCallback(() => {
    if (!isAuthenticated) return;
    setIsReplying(true);
  }, [isAuthenticated]);

  const handleCancelReply = useCallback(() => {
    setIsReplying(false);
  }, []);

  const handleReplySuccess = useCallback(() => {
    setIsReplying(false);
    setShowRepliesSection(true);
  }, []);

  const toggleReplies = useCallback(() => {
    setShowRepliesSection((prev) => !prev);
  }, []);

  // ✅ Можно отвечать только на комментарии верхнего уровня (не reply)
  // ✅ И нельзя отвечать на свой собственный комментарий
  const isOwnComment = currentUser?.id === comment.userId;
  const canReply = !isReply && !isOwnComment && isAuthenticated;

  const authorUsername = commentAuthor?.username || 'Unknown';
  const authorImageId = commentAuthor?.imageId || null;
  const profilePath = commentAuthor?.username 
    ? buildPath.profile(commentAuthor.username) 
    : '#';

  // Edit mode
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
      paddingY={2}
      dangerouslySetInlineStyle={{
        __style: { opacity: isDeleting ? 0.5 : 1 },
      }}
    >
      <Flex gap={3} alignItems="start">
        {/* Avatar */}
        <Link to={profilePath}>
          <UserAvatar
            imageId={authorImageId}
            name={authorUsername}
            size="sm"
          />
        </Link>

        {/* Content */}
        <Box flex="grow">
          {/* Header */}
          <Flex alignItems="center" gap={2}>
            <Link
              to={profilePath}
              style={{ textDecoration: 'none' }}
            >
              <Text weight="bold" size="200">
                {authorUsername}
              </Text>
            </Link>
            <Text color="subtle" size="100">
              {formatShortRelativeTime(comment.createdAt)}
            </Text>
            {comment.updatedAt !== comment.createdAt && (
              <Text color="subtle" size="100">
                (edited)
              </Text>
            )}
          </Flex>

          {/* Text content */}
          {comment.content && (
            <Box marginTop={1}>
              <Text size="200">{comment.content}</Text>
            </Box>
          )}

          {/* Image */}
          {comment.imageId && (
            <Box marginTop={2} maxWidth={300}>
              <ImagePreview
                imageId={comment.imageId}
                alt="Comment image"
                rounding={2}
              />
            </Box>
          )}

          {/* Actions */}
          <Box marginTop={2}>
            <CommentItemActions
              commentId={comment.id}
              isLiked={comment.isLiked}
              likeCount={comment.likeCount}
              replyCount={comment.replyCount}
              isOwner={isOwner}
              canReply={canReply}
              onReply={canReply ? handleReply : undefined}
              onEdit={isOwner ? handleEdit : undefined}
              onDelete={isOwner ? handleDelete : undefined}
            />
          </Box>

          {/* Reply form */}
          {isReplying && (
            <ReplyForm
              commentId={comment.id}
              onSuccess={handleReplySuccess}
              onCancel={handleCancelReply}
            />
          )}

          {/* Show replies toggle - только для комментариев верхнего уровня */}
          {showReplies && !isReply && comment.replyCount > 0 && (
            <Box marginTop={2}>
              <TapArea onTap={toggleReplies}>
                <Text size="100" color="subtle" weight="bold">
                  {getReplyToggleText(showRepliesSection, comment.replyCount)}
                </Text>
              </TapArea>
            </Box>
          )}

          {/* Replies section */}
          {showReplies && !isReply && showRepliesSection && (
            <Box marginTop={2}>
              <CommentReplies commentId={comment.id} />
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default CommentItem;