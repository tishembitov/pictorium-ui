// src/pages/ProfilePinsTab.tsx

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, Button, TapArea, Icon } from 'gestalt';
import { 
  PinGrid, 
  PinSortSelect,
  useUserPins,
} from '@/modules/pin';
import { usePinPreferencesStore } from '@/modules/pin/stores/pinPreferencesStore';
import { ROUTES } from '@/app/router/routeConfig';

interface ProfilePinsTabProps {
  userId: string;
  isOwner?: boolean;
}

const ProfilePinsTab: React.FC<ProfilePinsTabProps> = ({ 
  userId, 
  isOwner = false,
}) => {
  const navigate = useNavigate();
  const [showOnlyCreated, setShowOnlyCreated] = useState(false);
  
  // Global sort preference
  const sort = usePinPreferencesStore((s) => s.sort);

  // Fetch pins based on filter
  const scope = showOnlyCreated ? 'CREATED' : 'SAVED_ALL';
  
  const {
    pins,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUserPins(userId, scope, { sort });

  const handleToggleCreated = useCallback(() => {
    setShowOnlyCreated(prev => !prev);
  }, []);

  const handleCreatePin = useCallback(() => {
    navigate(ROUTES.PIN_CREATE);
  }, [navigate]);

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const displayCount = pins.length > 0 ? totalElements : 0;

  const getEmptyMessage = () => {
    if (showOnlyCreated) {
      return isOwner ? "You haven't created any pins yet" : "No pins created yet";
    }
    return isOwner ? "You haven't saved any pins yet" : "No saved pins yet";
  };

  return (
    <Box>
      {/* Header */}
      <Box marginBottom={4}>
        <Flex justifyContent="between" alignItems="center" wrap gap={3}>
          {/* Left side - Count and Filter */}
          <Flex alignItems="center" gap={3}>
            <Text size="300" weight="bold">
              {displayCount} {displayCount === 1 ? 'Pin' : 'Pins'}
            </Text>
            
            {/* Created by me filter button */}
            <TapArea onTap={handleToggleCreated} rounding="pill">
              <Box
                paddingX={3}
                paddingY={2}
                rounding="pill"
                display="flex"
                alignItems="center"
                dangerouslySetInlineStyle={{
                  __style: {
                    backgroundColor: showOnlyCreated 
                      ? 'var(--color-primary)' 
                      : 'var(--bg-secondary)',
                    transition: 'all 0.15s ease',
                  },
                }}
              >
                <Flex alignItems="center" gap={2}>
                  {showOnlyCreated && (
                    <Icon 
                      accessibilityLabel="" 
                      icon="check" 
                      size={12} 
                      color="inverse" 
                    />
                  )}
                  <Text 
                    size="200" 
                    weight="bold"
                    color={showOnlyCreated ? 'inverse' : 'default'}
                  >
                    Created by {isOwner ? 'me' : 'user'}
                  </Text>
                </Flex>
              </Box>
            </TapArea>
            
            <PinSortSelect size="md" />
          </Flex>
          
          {/* Right side - Create button */}
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

      {/* Pins Grid */}
      <PinGrid
        pins={pins}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={handleFetchNextPage}
        emptyMessage={getEmptyMessage()}
        emptyAction={
          isOwner && showOnlyCreated
            ? { text: 'Create your first pin', onClick: handleCreatePin }
            : undefined
        }
      />
    </Box>
  );
};

export default ProfilePinsTab;