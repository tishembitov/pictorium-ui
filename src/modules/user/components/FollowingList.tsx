// src/modules/user/components/FollowingList.tsx

import React from 'react';
import { Box, Flex, Spinner, Text } from 'gestalt';
import { UserCard } from './UserCard';
import { EmptyState, InfiniteScroll } from '@/shared/components';
import { useInfiniteFollowing } from '../hooks/useFollowing';
import { formatCompactNumber } from '@/shared/utils/formatters';

interface FollowingListProps {
  userId: string;
  emptyMessage?: string;
}

export const FollowingList: React.FC<FollowingListProps> = ({
  userId,
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
      <Box display="flex" justifyContent="center" padding={6}>
        <Spinner accessibilityLabel="Loading following" show />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box padding={4}>
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
        icon="person"
      />
    );
  }

  return (
    <Box>
      <Box marginBottom={2}>
        <Text color="subtle" size="200">
          Following {formatCompactNumber(totalElements)} {totalElements === 1 ? 'user' : 'users'}
        </Text>
      </Box>

      <InfiniteScroll
        loadMore={() => fetchNextPage()}
        hasMore={hasNextPage ?? false}
        isLoading={isFetchingNextPage}
      >
        <Flex direction="column" gap={1}>
          {following.map((user) => (
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

export default FollowingList;