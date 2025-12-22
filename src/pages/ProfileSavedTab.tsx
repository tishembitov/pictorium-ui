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
import { PinGrid, useInfinitePins, usePinFiltersStore } from '@/modules/pin';
import { BoardPicker, useSelectedBoard } from '@/modules/board';
import { ROUTES } from '@/app/router/routeConfig';
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
  
  const filter = usePinFiltersStore((state) => state.filter);
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

  const handleFetchNextPage = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const handleBoardChange = useCallback((board: { title: string } | null) => {
    if (board) {
      toast.success(`Default board: "${board.title}"`);
    }
  }, [toast]);

  // Используем длину pins для точного отображения после оптимистичных удалений
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
          </Flex>
          
          {/* Board Picker для владельца - БЕЗ возможности деселекта */}
          {isOwner && (
            <BoardPicker 
              size="md" 
              onBoardChange={handleBoardChange}
              showLabel
              allowDeselect={false}
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