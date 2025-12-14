// ================================================
// FILE: src/pages/ProfileCreatedTab.tsx
// ================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Button, Text } from 'gestalt';
import { PinGrid, PinFilters, useInfinitePins, usePinFiltersStore } from '@/modules/pin';
import { useIsOwner } from '@/modules/auth';
import { ROUTES } from '@/shared/utils/constants';

interface ProfileCreatedTabProps {
  userId: string;
}

const ProfileCreatedTab: React.FC<ProfileCreatedTabProps> = ({ userId }) => {
  const navigate = useNavigate();
  const isOwner = useIsOwner(userId);
  
  const filter = usePinFiltersStore((state) => state.filter);
  const hasActiveFilters = usePinFiltersStore((state) => state.hasActiveFilters);

  const {
    pins,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePins({ ...filter, authorId: userId });

  const handleCreatePin = () => {
    navigate(ROUTES.PIN_CREATE);
  };

  return (
    <Box>
      {/* Header - Flex обёрнут в Box для marginBottom */}
      <Box marginBottom={4}>
        <Flex justifyContent="between" alignItems="center">
          <Text size="300" weight="bold">
            {totalElements} {totalElements === 1 ? 'Pin' : 'Pins'}
          </Text>
          
          {isOwner && (
            <Button
              text="Create Pin"
              onClick={handleCreatePin}
              color="red"
              size="md"
            />
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
        emptyMessage={isOwner ? "You haven't created any pins yet" : "No pins created yet"}
        emptyAction={
          isOwner
            ? { text: 'Create your first pin', onClick: handleCreatePin }
            : undefined
        }
      />
    </Box>
  );
};

export default ProfileCreatedTab;