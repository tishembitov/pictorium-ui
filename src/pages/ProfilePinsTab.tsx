// src/pages/ProfilePinsTab.tsx

import React, { useCallback, useState, useMemo } from 'react';
import { Box, Flex, Text, TapArea } from 'gestalt';
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
  const [activeTab, setActiveTab] = useState<'saved' | 'created'>('saved');
  const sort = usePinPreferencesStore((s) => s.sort);

  const scope: PinScope = useMemo(() => {
    if (!isOwner) {
      return 'CREATED';
    }
    return activeTab === 'created' ? 'CREATED' : 'SAVED';
  }, [isOwner, activeTab]);
  
  const {
    pins,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUserPins(userId, scope, { sort });

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const displayCount = pins.length > 0 ? totalElements : 0;

  const emptyMessage = useMemo(() => {
    if (!isOwner) {
      return "No pins created yet";
    }
    if (activeTab === 'created') {
      return "You haven't created any pins yet";
    }
    return "You haven't saved any pins yet";
  }, [isOwner, activeTab]);

  return (
    <Box>
      {/* Header */}
      <Box marginBottom={4}>
        <Flex alignItems="center" gap={3}>
          {/* Tabs (only for owner) */}
          {isOwner && (
            <Flex gap={1} alignItems="center">
              {/* Saved Tab */}
              <TapArea 
                onTap={() => setActiveTab('saved')} 
                rounding="pill"
              >
                <Box
                  paddingX={4}
                  paddingY={2}
                  rounding="pill"
                  dangerouslySetInlineStyle={{
                    __style: {
                      backgroundColor: activeTab === 'saved' 
                        ? '#111' 
                        : 'transparent',
                      transition: 'all 0.15s ease',
                    },
                  }}
                >
                  <Text 
                    weight="bold" 
                    size="200"
                    color={activeTab === 'saved' ? 'inverse' : 'default'}
                  >
                    Saved
                  </Text>
                </Box>
              </TapArea>

              {/* Created Tab */}
              <TapArea 
                onTap={() => setActiveTab('created')} 
                rounding="pill"
              >
                <Box
                  paddingX={4}
                  paddingY={2}
                  rounding="pill"
                  dangerouslySetInlineStyle={{
                    __style: {
                      backgroundColor: activeTab === 'created' 
                        ? '#111' 
                        : 'transparent',
                      transition: 'all 0.15s ease',
                    },
                  }}
                >
                  <Text 
                    weight="bold" 
                    size="200"
                    color={activeTab === 'created' ? 'inverse' : 'default'}
                  >
                    Created
                  </Text>
                </Box>
              </TapArea>
            </Flex>
          )}

          {/* Divider (only if tabs shown) */}
          {isOwner && (
            <Box
              dangerouslySetInlineStyle={{
                __style: {
                  width: 1,
                  height: 24,
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                },
              }}
            />
          )}

          {/* Sort */}
          <PinSortSelect size="md" />


          {/* Count */}
          <Text size="300" color="subtle">
            {displayCount} {displayCount === 1 ? 'Pin' : 'Pins'}
          </Text>
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