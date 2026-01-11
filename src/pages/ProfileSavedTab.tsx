// src/pages/ProfileSavedTab.tsx

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Flex, 
  Text, 
  Heading,
  Icon,
} from 'gestalt';
import { 
  PinGrid, 
  PinSortSelect,
  useUserPins,
} from '@/modules/pin';
import { usePinPreferencesStore } from '@/modules/pin/stores/pinPreferencesStore';
import { BoardPicker, useSelectedBoard } from '@/modules/board';
import { ROUTES } from '@/app/router/routes';
import { useToast } from '@/shared/hooks/useToast';

interface ProfileSavedTabProps {
  userId: string;
  isOwner?: boolean;
}

const ProfileSavedTab: React.FC<ProfileSavedTabProps> = ({ 
  userId, 
  isOwner = false,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Global sort preference
  const sort = usePinPreferencesStore((s) => s.sort);
  const { selectedBoard } = useSelectedBoard();

  // Fetch user's saved pins (SAVED_ALL = boards + profile)
  const {
    pins,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUserPins(userId, 'SAVED_ALL', { sort });

  const handleExplore = useCallback(() => {
    navigate(ROUTES.EXPLORE);
  }, [navigate]);

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const handleBoardChange = useCallback((board: { title: string } | null) => {
    if (board) {
      toast.board.selected(board.title);
    }
  }, [toast]);

  // Use pins.length for accurate count after optimistic updates
  const displayCount = pins.length > 0 ? totalElements : 0;

  return (
    <Box>
      {/* Header */}
      <Box marginBottom={6}>
        <Flex justifyContent="between" alignItems="center" wrap>
          <Flex alignItems="center" gap={3}>
            <Heading size="400" accessibilityLevel={2}>
              Saved
            </Heading>
            <Box 
              color="secondary" 
              rounding="pill" 
              paddingX={3} 
              paddingY={1}
            >
              <Text size="200" weight="bold">
                {displayCount}
              </Text>
            </Box>
            <PinSortSelect size="md" />
          </Flex>
          
          {/* Board Picker for owner */}
          {isOwner && (
            <BoardPicker 
              size="md" 
              onBoardChange={handleBoardChange}
              showLabel
            />
          )}
        </Flex>
      </Box>

      {/* Active Board Indicator */}
      {isOwner && selectedBoard && (
        <Box 
          marginBottom={4} 
          padding={4} 
          rounding={4}
          dangerouslySetInlineStyle={{
            __style: {
              background: 'linear-gradient(135deg, #0a7c42 0%, #0d9f4f 100%)',
            },
          }}
        >
          <Flex alignItems="center" gap={3}>
            <Box 
              color="light" 
              rounding="circle" 
              padding={2}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon accessibilityLabel="" icon="check" size={14} color="success" />
            </Box>
            <Flex direction="column">
              <Text size="100" color="inverse">
                New pins will be saved to
              </Text>
              <Text weight="bold" color="inverse" size="300">
                {selectedBoard.title}
              </Text>
            </Flex>
          </Flex>
        </Box>
      )}

      {/* Pins Grid */}
      <PinGrid
        pins={pins}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={handleFetchNextPage}
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