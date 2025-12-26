// src/pages/ProfileLikedTab.tsx

import React, { useCallback } from 'react';
import { Box, Flex, Text } from 'gestalt';
import { 
  PinGrid, 
  PinSortSelect,
  useUserPins,
} from '@/modules/pin';
import { usePinPreferencesStore } from '@/modules/pin/stores/pinPreferencesStore';

interface ProfileLikedTabProps {
  userId: string;
  isOwner?: boolean;
}

const ProfileLikedTab: React.FC<ProfileLikedTabProps> = ({ userId, isOwner = false }) => {
  // Global sort preference
  const sort = usePinPreferencesStore((s) => s.sort);

  // Fetch user's liked pins
  const {
    pins,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUserPins(userId, 'LIKED', { sort });

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  // Use pins.length for accurate count after optimistic updates
  const displayCount = pins.length > 0 ? totalElements : 0;

  return (
    <Box>
      {/* Header */}
      <Box marginBottom={4}>
        <Flex justifyContent="between" alignItems="center">
          <Flex alignItems="center" gap={3}>
            <Text size="300" weight="bold">
              {displayCount} Liked {displayCount === 1 ? 'Pin' : 'Pins'}
            </Text>
            <PinSortSelect size="md" />
          </Flex>
        </Flex>
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