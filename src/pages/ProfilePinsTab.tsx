// src/pages/ProfilePinsTab.tsx

import React, { useCallback, useState, useMemo } from 'react';
import { Box, Flex, Text, TapArea, Icon } from 'gestalt';
import { 
  PinGrid, 
  PinSortSelect,
  useUserPins,
} from '@/modules/pin';
import { usePinPreferencesStore } from '@/modules/pin/stores/pinPreferencesStore';
import type { PinScope } from '@/modules/pin';

interface ProfilePinsTabProps {
  userId: string;
  isOwner?: boolean;
}

const ProfilePinsTab: React.FC<ProfilePinsTabProps> = ({ 
  userId, 
  isOwner = false,
}) => {
  const [showOnlyCreated, setShowOnlyCreated] = useState(false);
  
  // Global sort preference
  const sort = usePinPreferencesStore((s) => s.sort);

  // Для своего профиля: можем переключать между SAVED_ALL и CREATED
  // Для чужого профиля: только CREATED (сохранённые - приватные данные)
  const scope: PinScope = useMemo(() => {
    if (!isOwner) {
      return 'CREATED';
    }
    return showOnlyCreated ? 'CREATED' : 'SAVED_ALL';
  }, [isOwner, showOnlyCreated]);
  
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

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const displayCount = pins.length > 0 ? totalElements : 0;

  const emptyMessage = useMemo(() => {
    if (!isOwner) {
      return "No pins created yet";
    }
    if (showOnlyCreated) {
      return "You haven't created any pins yet";
    }
    return "You haven't saved any pins yet";
  }, [isOwner, showOnlyCreated]);

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
            
            {/* Created by me filter - только для своего профиля */}
            {isOwner && (
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
                      Created by me
                    </Text>
                  </Flex>
                </Box>
              </TapArea>
            )}
            
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
        emptyMessage={emptyMessage}
      />
    </Box>
  );
};

export default ProfilePinsTab;