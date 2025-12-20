// src/pages/ProfileLikedTab.tsx

import React from 'react';
import { Box, Flex, Text } from 'gestalt';
import { PinGrid, PinFilters, useInfinitePins, usePinFiltersStore } from '@/modules/pin';

interface ProfileLikedTabProps {
  userId: string;
  isOwner?: boolean;
}

const ProfileLikedTab: React.FC<ProfileLikedTabProps> = ({ userId, isOwner = false }) => {
  const filter = usePinFiltersStore((state) => state.filter);
  const hasActiveFilters = usePinFiltersStore((state) => state.hasActiveFilters);

  const {
    pins,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePins({ ...filter, likedBy: userId });

  // ✅ Используем длину pins для точного отображения после оптимистичных удалений
  const displayCount = pins.length > 0 ? totalElements : 0;

  return (
    <Box>
      {/* Header */}
      <Box marginBottom={4}>
        <Flex justifyContent="between" alignItems="center">
          <Text size="300" weight="bold">
            {displayCount} Liked {displayCount === 1 ? 'Pin' : 'Pins'}
          </Text>
        </Flex>
      </Box>

      {/* Filters */}
      <Box marginBottom={4}>
        <PinFilters showSort showTags={false} showClear={hasActiveFilters()} />
      </Box>

      {/* Pins Grid */}
      <PinGrid
        pins={pins}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        emptyMessage={isOwner ? "You haven't liked any pins yet" : "No liked pins yet"}
      />
    </Box>
  );
};

export default ProfileLikedTab;