// src/modules/pin/components/PinSaveSection.tsx

import React, { useCallback, useMemo } from 'react';
import { Box, Flex, Text } from 'gestalt';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { 
  useMyBoardsForPin, 
  useSavePinToBoard,
  BoardDropdown,
  useSelectedBoardStore,
} from '@/modules/board';
import { useUnsavePin } from '../hooks/useUnsavePin';
import { buildPath } from '@/app/router/routeConfig';
import { useToast } from '@/shared/hooks/useToast';
import { PinSaveButton } from './PinSaveButton';
import type { BoardResponse } from '@/modules/board';

interface PinSaveSectionProps {
  pinId: string;
  isSaved: boolean;
  lastSavedBoardName?: string | null;
  savedToBoardsCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const PinSaveSection: React.FC<PinSaveSectionProps> = ({
  pinId,
  isSaved,
  lastSavedBoardName,
  savedToBoardsCount = 0,
  size = 'md',
}) => {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();

  // Store
  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);

  // Boards data
  const { 
    boards,
    refetch: refetchBoards,
  } = useMyBoardsForPin(pinId, { enabled: isAuthenticated });

  // Find saved board for link
  const savedBoard = useMemo(() => 
    boards.find(b => b.hasPin), 
    [boards]
  );

  // Mutations
  const { savePinToBoard, isLoading: isSavingToBoard } = useSavePinToBoard({
    showToast: false,
    onSuccess: () => void refetchBoards(),
  });

  const { unsavePin, isLoading: isUnsaving } = useUnsavePin({
    showToast: false,
    onSuccess: () => void refetchBoards(),
  });

  const isLoading = isSavingToBoard || isUnsaving;

  // ==================== Handlers ====================

  const handleQuickSave = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (!selectedBoard) {
      toast.error('Please select a board first');
      return;
    }

    const alreadySaved = boards.find(b => b.id === selectedBoard.id)?.hasPin;
    if (alreadySaved) {
      toast.info(`Already saved to "${selectedBoard.title}"`);
      return;
    }

    savePinToBoard({ boardId: selectedBoard.id, pinId });
    toast.success(`Saved to "${selectedBoard.title}"`);
  }, [isAuthenticated, login, selectedBoard, boards, savePinToBoard, pinId, toast]);

  const handleUnsave = useCallback(() => {
    unsavePin(pinId);
  }, [unsavePin, pinId]);

  const handleBoardSelect = useCallback((board: BoardResponse) => {
    if (!isSaved) {
      savePinToBoard({ boardId: board.id, pinId });
      toast.success(`Saved to "${board.title}"`);
    }
  }, [isSaved, savePinToBoard, pinId, toast]);

  // ==================== Render ====================

  // Already saved
  if (isSaved) {
    const displayText = savedToBoardsCount > 1 
      ? `${lastSavedBoardName} +${savedToBoardsCount - 1}` 
      : lastSavedBoardName;

    return (
      <Flex alignItems="center" gap={3}>
        {/* Saved location badge */}
        {savedBoard && (
          <Link 
            to={buildPath.board(savedBoard.id)} 
            style={{ textDecoration: 'none' }}
          >
            <Box
              paddingX={3}
              paddingY={2}
              rounding={2}
              color="secondary"
            >
              <Text size="200" weight="bold" lineClamp={1}>
                {displayText}
              </Text>
            </Box>
          </Link>
        )}
        
        <PinSaveButton
          isSaved={true}
          onUnsave={handleUnsave}
          isLoading={isLoading}
          size={size}
        />
      </Flex>
    );
  }

  // Not saved
  return (
    <Flex alignItems="center" gap={3}>
      <BoardDropdown
        pinId={pinId}
        onBoardSelect={handleBoardSelect}
        size={size}
      />
      <PinSaveButton
        isSaved={false}
        onSave={handleQuickSave}
        isLoading={isLoading}
        disabled={!selectedBoard}
        size={size}
      />
    </Flex>
  );
};

export default PinSaveSection;