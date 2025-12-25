// src/pages/ProfileCreatedTab.tsx

import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Button, Text } from 'gestalt';
import { 
  PinGrid, 
  PinFilters, 
  useInfinitePins, 
  usePinFiltersStore,
  selectFilter,
} from '@/modules/pin';
import { hasActiveFilters as checkActiveFilters } from '@/modules/pin/utils/pinFilterUtils';
import { useIsOwner } from '@/modules/auth';
import { ROUTES } from '@/app/router/routeConfig';

interface ProfileCreatedTabProps {
  userId: string;
  isOwner?: boolean;
}

const ProfileCreatedTab: React.FC<ProfileCreatedTabProps> = ({ 
  userId, 
  isOwner = false,
}) => {
  const navigate = useNavigate();
  const isCurrentUserOwner = useIsOwner(userId);
  const effectiveIsOwner = isOwner || isCurrentUserOwner;
  
  // Use stable selector
  const filter = usePinFiltersStore(selectFilter);
  
  // Memoize computed values
  const hasFilters = useMemo(() => checkActiveFilters(filter), [filter]);
  
  // Memoize the combined filter
  const combinedFilter = useMemo(() => ({
    ...filter,
    authorId: userId,
  }), [filter, userId]);

  const {
    pins,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePins(combinedFilter);

  const handleCreatePin = useCallback(() => {
    navigate(ROUTES.PIN_CREATE);
  }, [navigate]);

  const handleFetchNextPage = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  return (
    <Box>
      {/* Header */}
      <Box marginBottom={4}>
        <Flex justifyContent="between" alignItems="center">
          <Text size="300" weight="bold">
            {totalElements} {totalElements === 1 ? 'Pin' : 'Pins'}
          </Text>
          
          {effectiveIsOwner && (
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
        <PinFilters showSort showTags={false} showClear={hasFilters} showScope={false} />
      </Box>

      {/* Pins Grid */}
      <PinGrid
        pins={pins}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={handleFetchNextPage}
        emptyMessage={effectiveIsOwner ? "You haven't created any pins yet" : "No pins created yet"}
        emptyAction={
          effectiveIsOwner
            ? { text: 'Create your first pin', onClick: handleCreatePin }
            : undefined
        }
      />
    </Box>
  );
};

export default ProfileCreatedTab;