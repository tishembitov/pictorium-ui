// src/modules/user/components/FollowersList.tsx

import React from 'react';
import { Box, Flex, Spinner, Text, Heading } from 'gestalt';
import { UserCard } from './UserCard';
import { EmptyState, InfiniteScroll } from '@/shared/components';
import { useInfiniteFollowers } from '../hooks/useFollowers';
import { formatCompactNumber } from '@/shared/utils/formatters';

interface FollowersListProps {
  userId: string;
  username?: string;
  emptyMessage?: string;
}

export const FollowersList: React.FC<FollowersListProps> = ({
  userId,
  username,
  emptyMessage = 'No followers yet',
}) => {
  const {
    followers,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteFollowers(userId);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={8}>
        <Spinner accessibilityLabel="Loading followers" show size="lg" />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box padding={6}>
        <Text color="error" align="center">
          Failed to load followers
        </Text>
      </Box>
    );
  }

  if (followers.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        description={username ? `${username} doesn't have any followers yet` : undefined}
        icon="person"
      />
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box marginBottom={4}>
        <Heading size="400">
          {formatCompactNumber(totalElements)} {totalElements === 1 ? 'Follower' : 'Followers'}
        </Heading>
      </Box>

      {/* List */}
      <InfiniteScroll
        loadMore={() => fetchNextPage()}
        hasMore={hasNextPage ?? false}
        isLoading={isFetchingNextPage}
      >
        <Flex direction="column" gap={2}>
          {followers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              showFollowButton
              variant="horizontal"
            />
          ))}
        </Flex>
      </InfiniteScroll>
    </Box>
  );
};

export default FollowersList;