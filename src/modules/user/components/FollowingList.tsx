// src/modules/user/components/FollowingList.tsx

import React from 'react';
import { Box, Flex, Spinner, Text, Heading } from 'gestalt';
import { UserCard } from './UserCard';
import { EmptyState, InfiniteScroll } from '@/shared/components';
import { useInfiniteFollowing } from '../hooks/useFollowing';
import { formatCompactNumber } from '@/shared/utils/formatters';

interface FollowingListProps {
  userId: string;
  username?: string;
  emptyMessage?: string;
}

export const FollowingList: React.FC<FollowingListProps> = ({
  userId,
  username,
  emptyMessage = 'Not following anyone yet',
}) => {
  const {
    following,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteFollowing(userId);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={8}>
        <Spinner accessibilityLabel="Loading following" show size="lg" />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box padding={6}>
        <Text color="error" align="center">
          Failed to load following
        </Text>
      </Box>
    );
  }

  if (following.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        description={username ? `${username} isn't following anyone yet` : undefined}
        icon="person"
      />
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box marginBottom={4}>
        <Heading size="400">
          Following {formatCompactNumber(totalElements)} {totalElements === 1 ? 'person' : 'people'}
        </Heading>
      </Box>

      {/* List */}
      <InfiniteScroll
        loadMore={() => fetchNextPage()}
        hasMore={hasNextPage ?? false}
        isLoading={isFetchingNextPage}
      >
        <Flex direction="column" gap={2}>
          {following.map((user) => (
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

export default FollowingList;