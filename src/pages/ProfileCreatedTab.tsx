// src/pages/ProfileCreatedTab.tsx

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Button, Text } from 'gestalt';
import { 
  PinGrid, 
  PinSortSelect,
  useUserPins,
} from '@/modules/pin';
import { usePinPreferencesStore } from '@/modules/pin/stores/pinPreferencesStore';
import { useIsOwner } from '@/modules/auth';
import { ROUTES } from '@/app/router/routes';

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
  
  // Global sort preference
  const sort = usePinPreferencesStore((s) => s.sort);

  // Fetch user's created pins
  const {
    pins,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUserPins(userId, 'CREATED', { sort });

  const handleCreatePin = useCallback(() => {
    navigate(ROUTES.PIN_CREATE);
  }, [navigate]);

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  return (
    <Box>
      {/* Header */}
      <Box marginBottom={4}>
        <Flex justifyContent="between" alignItems="center">
          <Flex alignItems="center" gap={3}>
            <Text size="300" weight="bold">
              {totalElements} {totalElements === 1 ? 'Pin' : 'Pins'}
            </Text>
            <PinSortSelect size="md" />
          </Flex>
          
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