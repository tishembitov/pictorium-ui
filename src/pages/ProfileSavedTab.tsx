// ================================================
// FILE: src/pages/ProfileSavedTab.tsx
// ================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text } from 'gestalt';
import { PinGrid, PinFilters, useInfinitePins, usePinFiltersStore } from '@/modules/pin';
import { BoardPicker, useSelectedBoard } from '@/modules/board';
import { ROUTES } from '@/app/router/routeConfig';

interface ProfileSavedTabProps {
  userId: string;
  isOwner?: boolean;
}

const ProfileSavedTab: React.FC<ProfileSavedTabProps> = ({ userId, isOwner = false }) => {
  const navigate = useNavigate();
  
  const filter = usePinFiltersStore((state) => state.filter);
  const hasActiveFilters = usePinFiltersStore((state) => state.hasActiveFilters);
  
  const { selectedBoard } = useSelectedBoard();

  const {
    pins,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePins({ ...filter, savedBy: userId });

  const handleExplore = () => {
    navigate(ROUTES.EXPLORE);
  };

  return (
    <Box>
      {/* Header - Flex обёрнут в Box для marginBottom */}
      <Box marginBottom={4}>
        <Flex justifyContent="between" alignItems="center" wrap>
          <Text size="300" weight="bold">
            {totalElements} Saved {totalElements === 1 ? 'Pin' : 'Pins'}
          </Text>
          
          {isOwner && (
            <Flex alignItems="center" gap={2}>
              <Text size="200" color="subtle">Quick save to:</Text>
              <BoardPicker size="sm" />
              {selectedBoard && (
                <Text size="200">{selectedBoard.title}</Text>
              )}
            </Flex>
          )}
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
        emptyMessage={isOwner ? "You haven't saved any pins yet" : "No saved pins yet"}
        emptyAction={
          isOwner
            ? { text: 'Explore pins', onClick: handleExplore }
            : undefined
        }
      />
    </Box>
  );
};

export default ProfileSavedTab;