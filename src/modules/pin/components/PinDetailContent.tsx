// src/modules/pin/components/PinDetailContent.tsx

import React, { useCallback } from 'react';
import { Box, Flex, Text, Divider, Icon } from 'gestalt';
import { Link } from 'react-router-dom';
import { PinSaveButton } from './PinSaveButton';
import { PinLikeButton } from './PinLikeButton';
import { PinShareButton } from './PinShareButton';
import { PinMenuButton } from './PinMenuButton';
import { TagList } from '@/modules/tag';
import { UserAvatar, useUser, FollowButton } from '@/modules/user';
import { CommentList } from '@/modules/comment';
import { useAuth, useIsOwner } from '@/modules/auth';
import { useInfinitePinComments } from '../hooks/usePinComments';
import { buildPath } from '@/app/router/routeConfig';
import { formatRelativeTime } from '@/shared/utils/formatters';
import type { PinResponse } from '../types/pin.types';
import type { CommentCreateRequest } from '@/modules/comment';
import useCreateComment from '../hooks/useCreateComment';

interface PinDetailContentProps {
  pin: PinResponse;
}

// Компонент для отображения ссылки на источник
const SourceLink: React.FC<{ href: string }> = ({ href }) => {
  const getDomain = (url: string): string => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <Box
        paddingX={3}
        paddingY={2}
        rounding="pill"
        color="secondary"
        display="inlineBlock"
      >
        <Flex alignItems="center" gap={2}>
          <Icon accessibilityLabel="" icon="link" size={14} color="dark" />
          <Text size="200" weight="bold">
            {getDomain(href)}
          </Text>
        </Flex>
      </Box>
    </a>
  );
};

export const PinDetailContent: React.FC<PinDetailContentProps> = ({ pin }) => {
  const { isAuthenticated } = useAuth();
  const isOwner = useIsOwner(pin.userId);
  const { user: author } = useUser(pin.userId);

  const {
    comments,
    totalElements: commentCount,
    isLoading: isLoadingComments,
    isFetchingNextPage: isFetchingMoreComments,
    hasNextPage: hasMoreComments,
    fetchNextPage: fetchMoreComments,
  } = useInfinitePinComments(pin.id, { enabled: true });

  const { createComment, isLoading: isCreatingComment } = useCreateComment(pin.id);

  const handleCreateComment = useCallback((data: CommentCreateRequest) => {
    createComment(data);
  }, [createComment]);

  const handleFetchMoreComments = useCallback(() => {
    void fetchMoreComments();
  }, [fetchMoreComments]);

  return (
    <Box padding={6} height="100%">
      <Flex direction="column" gap={4}>
        {/* Top Actions Bar */}
        <Flex justifyContent="between" alignItems="center">
          {/* Left: Share & More */}
          <Flex gap={2} alignItems="center">
            <PinShareButton pin={pin} size="lg" />
            <PinMenuButton pin={pin} size="lg" />
          </Flex>

          {/* Right: Save Button */}
          <PinSaveButton
            pinId={pin.id}
            isSaved={pin.isSaved}
            size="lg"
          />
        </Flex>

        {/* Source Link */}
        {pin.href && (
          <SourceLink href={pin.href} />
        )}

        {/* Title */}
        {pin.title && (
          <Text size="500" weight="bold">
            {pin.title}
          </Text>
        )}

        {/* Description */}
        {pin.description && (
          <Text size="300" color="default">
            {pin.description}
          </Text>
        )}

        {/* Tags */}
        {pin.tags.length > 0 && (
          <TagList 
            tags={pin.tags} 
            navigateOnClick 
            size="md" 
            wrap
          />
        )}

        {/* Like Button & Stats */}
        <Flex alignItems="center" gap={4}>
          <PinLikeButton
            pinId={pin.id}
            isLiked={pin.isLiked}
            likeCount={pin.likeCount}
            size="md"
            variant="button"
          />
          <Text color="subtle" size="200">
            {pin.viewCount} views
          </Text>
        </Flex>

        <Divider />

        {/* Author Section */}
        {author && (
          <Flex alignItems="center" justifyContent="between">
            <Link 
              to={buildPath.profile(author.username)}
              style={{ textDecoration: 'none' }}
            >
              <Flex alignItems="center" gap={3}>
                <UserAvatar
                  imageId={author.imageId}
                  name={author.username}
                  size="md"
                />
                <Flex direction="column">
                  <Text weight="bold" size="300">
                    {author.username}
                  </Text>
                  <Text color="subtle" size="200">
                    {formatRelativeTime(pin.createdAt)}
                  </Text>
                </Flex>
              </Flex>
            </Link>

            {!isOwner && isAuthenticated && (
              <FollowButton userId={author.id} size="md" />
            )}
          </Flex>
        )}

        <Divider />

        {/* Comments Section */}
        <Box>
          <Text weight="bold" size="300">
            {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
          </Text>

          <Box marginTop={4}>
            <CommentList
              comments={comments}
              isLoading={isLoadingComments}
              isFetchingNextPage={isFetchingMoreComments}
              hasNextPage={hasMoreComments}
              fetchNextPage={handleFetchMoreComments}
              onCreateComment={handleCreateComment}
              isCreating={isCreatingComment}
              totalCount={commentCount}
              emptyMessage="No comments yet"
            />
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default PinDetailContent;