// ================================================
// FILE: src/pages/PinDetailPage.tsx
// ================================================
import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Flex, 
  Divider, 
  Heading, 
  Text, 
  Spinner, 
  IconButton,
  Tooltip,
} from 'gestalt';
import { 
  PinDetailImage,
  PinStats,
  PinGrid,
  PinLikeButton,
  PinSaveButton,
  PinShareButton,
  PinMenuButton,
  usePin, 
  useRelatedPins,
  useInfinitePinComments,
  useCreateComment,
} from '@/modules/pin';
import { 
  CommentList, 
  type CommentCreateRequest,
} from '@/modules/comment';
import { TagList } from '@/modules/tag';
import { UserCard, useUser } from '@/modules/user';
import { BoardSelector } from '@/modules/board';
import { useAuth, useIsOwner } from '@/modules/auth';
import { ErrorMessage } from '@/shared/components';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { useToast } from '@/shared/hooks/useToast';
import { ROUTES } from '@/shared/utils/constants';
import { buildPath } from '@/app/router/routeConfig';
import { formatRelativeTime } from '@/shared/utils/formatters';

const PinDetailPage: React.FC = () => {
  const { pinId } = useParams<{ pinId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { copy, copied } = useCopyToClipboard();

  // Pin data
  const { pin, isLoading, isError, error, refetch } = usePin(pinId);
  const isOwner = useIsOwner(pin?.userId);

  // Author data
  const { user: author } = useUser(pin?.userId);

  // Comments
  const {
    comments,
    totalElements: commentCount,
    isLoading: isLoadingComments,
    isFetchingNextPage: isFetchingMoreComments,
    hasNextPage: hasMoreComments,
    fetchNextPage: fetchMoreComments,
  } = useInfinitePinComments(pinId, { enabled: !!pin });

  // Create comment
  const { createComment, isLoading: isCreatingComment } = useCreateComment(pinId || '');

  // Related pins
  const {
    pins: relatedPins,
    isLoading: isLoadingRelated,
    isFetchingNextPage: isFetchingMoreRelated,
    hasNextPage: hasMoreRelated,
    fetchNextPage: fetchMoreRelated,
  } = useRelatedPins(pinId, { enabled: !!pin });

  const handleCreateComment = (data: CommentCreateRequest) => {
    createComment(data);
  };

  const handleCopyLink = () => {
    const url = `${globalThis.location.origin}${buildPath.pin(pinId || '')}`;
    void copy(url);
    toast.success('Link copied to clipboard!');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    void refetch();
  };

  const handleFetchMoreComments = () => {
    void fetchMoreComments();
  };

  const handleFetchMoreRelated = () => {
    void fetchMoreRelated();
  };

  if (!pinId) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Spinner accessibilityLabel="Loading pin" show size="lg" />
      </Box>
    );
  }

  if (isError || !pin) {
    return (
      <Box paddingY={8}>
        <ErrorMessage
          title="Failed to load pin"
          message={error?.message || 'Pin not found'}
          onRetry={handleRetry}
        />
      </Box>
    );
  }

  return (
    <Box paddingY={4}>
      {/* Back Button */}
      <Box marginBottom={4}>
        <Tooltip text="Go back">
          <IconButton
            accessibilityLabel="Go back"
            icon="arrow-back"
            onClick={handleGoBack}
            size="lg"
            bgColor="transparent"
          />
        </Tooltip>
      </Box>

      {/* Main Content */}
      <Box 
        maxWidth={1200} 
        marginStart="auto" 
        marginEnd="auto"
        rounding={4}
        overflow="hidden"
        color="default"
        dangerouslySetInlineStyle={{
          __style: { boxShadow: 'var(--shadow-lg)' },
        }}
      >
        <Flex wrap>
          {/* Image Section */}
          <Box 
            minWidth={300} 
            maxWidth={600}
            flex="grow"
          >
            <PinDetailImage pin={pin} />
          </Box>

          {/* Content Section */}
          <Box 
            minWidth={300} 
            flex="grow" 
            padding={6}
          >
            {/* Header Actions */}
            <Flex justifyContent="between" alignItems="center">
              <Flex gap={2}>
                <PinShareButton pin={pin} size="lg" />
                <Tooltip text={copied ? 'Copied!' : 'Copy link'}>
                  <IconButton
                    accessibilityLabel="Copy link"
                    icon="link"
                    onClick={handleCopyLink}
                    size="lg"
                    bgColor="transparent"
                  />
                </Tooltip>
              </Flex>
              <PinMenuButton pin={pin} size="lg" />
            </Flex>

            {/* External Link */}
            {pin.href && (
              <Box marginTop={4}>
                <a
                  href={pin.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Flex alignItems="center" gap={1}>
                    <Text color="link" underline size="200">
                      Visit {new URL(pin.href).hostname}
                    </Text>
                  </Flex>
                </a>
              </Box>
            )}

            {/* Title */}
            {pin.title && (
              <Box marginTop={4}>
                <Heading size="400" accessibilityLevel={1}>
                  {pin.title}
                </Heading>
              </Box>
            )}

            {/* Description */}
            {pin.description && (
              <Box marginTop={2}>
                <Text color="subtle">{pin.description}</Text>
              </Box>
            )}

            {/* Tags */}
            {pin.tags.length > 0 && (
              <Box marginTop={4}>
                <TagList 
                  tags={pin.tags} 
                  navigateOnClick 
                  size="md" 
                  wrap
                />
              </Box>
            )}

            <Divider />

            {/* Actions */}
            <Box marginTop={4}>
              <Flex gap={3} wrap>
                <PinLikeButton
                  pinId={pin.id}
                  isLiked={pin.isLiked}
                  likeCount={pin.likeCount}
                  size="lg"
                  variant="button"
                />
                <PinSaveButton
                  pinId={pin.id}
                  isSaved={pin.isSaved}
                  size="lg"
                />
              </Flex>
            </Box>

            {/* Stats */}
            <Box marginTop={4}>
              <PinStats pin={pin} showLabels size="md" />
            </Box>

            <Divider />

            {/* Author */}
            {author && (
              <Box marginTop={4}>
                <Text size="200" weight="bold" color="subtle">
                  Created by
                </Text>
                <Box marginTop={2}>
                  <UserCard 
                    user={author} 
                    showFollowButton={!isOwner}
                    showDescription
                    size="md"
                  />
                </Box>
              </Box>
            )}

            {/* Created Date */}
            <Box marginTop={2}>
              <Text color="subtle" size="100">
                {formatRelativeTime(pin.createdAt)}
              </Text>
            </Box>

            <Divider />

            {/* Board Selector (for saving) */}
            {isAuthenticated && (
              <Box marginTop={4}>
                <Text size="200" weight="bold" color="subtle">
                  Save to board
                </Text>
                <Box marginTop={2}>
                  <BoardSelector 
                    pinId={pin.id}
                  />
                </Box>
              </Box>
            )}

            <Divider />

            {/* Comments Section */}
            <Box marginTop={4}>
              <Heading size="300" accessibilityLevel={2}>
                Comments ({commentCount})
              </Heading>
              
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
                  emptyMessage="No comments yet. Be the first!"
                />
              </Box>
            </Box>
          </Box>
        </Flex>
      </Box>

      {/* Related Pins */}
      <Box marginTop={8}>
        <Divider />
        
        <Box marginTop={6} marginBottom={4}>
          <Heading size="400" accessibilityLevel={2}>
            More like this
          </Heading>
        </Box>

        <PinGrid
          pins={relatedPins}
          isLoading={isLoadingRelated}
          isFetchingNextPage={isFetchingMoreRelated}
          hasNextPage={hasMoreRelated}
          fetchNextPage={handleFetchMoreRelated}
          emptyMessage="No related pins found"
        />
      </Box>
    </Box>
  );
};

export default PinDetailPage;