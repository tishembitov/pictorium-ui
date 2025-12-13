// src/modules/user/components/FollowersList.tsx

import React from 'react';
import { Box, Flex, Spinner, Text } from 'gestalt';
import { UserCard } from './UserCard';
import { EmptyState, InfiniteScroll } from '@/shared/components';
import { useInfiniteFollowers } from '../hooks/useFollowers';
import { formatCount } from '@/shared/utils/formatters';

interface FollowersListProps {
  userId: string;
  emptyMessage?: string;
}

export const FollowersList: React.FC<FollowersListProps> = ({
  userId,
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
      <Box display="flex" justifyContent="center" padding={6}>
        <Spinner accessibilityLabel="Loading followers" show />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box padding={4}>
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
        icon="person"
      />
    );
  }

  return (
    <Box>
      <Box marginBottom={2}>
        <Text color="subtle" size="200">
          {formatCount(totalElements, 'follower')}
        </Text>
      </Box>

      <InfiniteScroll
        loadMore={() => fetchNextPage()}
        hasMore={hasNextPage ?? false}
        isLoading={isFetchingNextPage}
      >
        <Flex direction="column" gap={1}>
          {followers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              showFollowButton
              showDescription
              showFormattedUsername
            />
          ))}
        </Flex>
      </InfiniteScroll>
    </Box>
  );
};

export default FollowersList;