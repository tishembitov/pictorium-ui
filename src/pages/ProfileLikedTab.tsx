// src/pages/ProfileLikedTab.tsx

import React, { useCallback, useMemo } from 'react';
import { Box, Flex, Text } from 'gestalt';
import { 
  PinGrid, 
  PinFilters, 
  useInfinitePins, 
  usePinFiltersStore,
  selectFilter,
} from '@/modules/pin';
import { hasActiveFilters as checkActiveFilters } from '@/modules/pin/utils/pinFilterUtils';

interface ProfileLikedTabProps {
  userId: string;
  isOwner?: boolean;
}

const ProfileLikedTab: React.FC<ProfileLikedTabProps> = ({ userId, isOwner = false }) => {
  // Use stable selector
  const filter = usePinFiltersStore(selectFilter);
  
  // Memoize computed values
  const hasFilters = useMemo(() => checkActiveFilters(filter), [filter]);
  
  // Memoize the combined filter
  const combinedFilter = useMemo(() => ({
    ...filter,
    likedBy: userId,
  }), [filter, userId]);

  const {
    pins,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePins(combinedFilter);

  const handleFetchNextPage = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  // Используем длину pins для точного отображения после оптимистичных удалений
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
        <PinFilters showSort showTags={false} showClear={hasFilters} showScope={false} />
      </Box>

      {/* Pins Grid */}
      <PinGrid
        pins={pins}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={handleFetchNextPage}
        emptyMessage={isOwner ? "You haven't liked any pins yet" : "No liked pins yet"}
      />
    </Box>
  );
};

export default ProfileLikedTab;