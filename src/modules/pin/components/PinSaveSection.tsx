// src/modules/pin/components/PinSaveSection.tsx

import React, { useCallback, useMemo, useState } from 'react';
import { Box, Flex, Text, Icon } from 'gestalt';
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
import { isPinSaved } from '../utils/pinUtils';
import { PinSaveButton } from './PinSaveButton';
import type { BoardResponse } from '@/modules/board';
import type { PinResponse } from '../types/pin.types';

interface PinSaveSectionProps {
  pinId: string;
  lastSavedBoardId: string | null;
  lastSavedBoardName: string | null;
  savedToBoardsCount: number;
  size?: 'sm' | 'md' | 'lg';
}

export const PinSaveSection: React.FC<PinSaveSectionProps> = ({
  pinId,
  lastSavedBoardId,
  lastSavedBoardName,
  savedToBoardsCount,
  size = 'md',
}) => {
  const { isAuthenticated, login } = useAuth();

  // Локальное состояние для немедленного отображения
  const [localSaveInfo, setLocalSaveInfo] = useState<{
    boardId: string;
    boardName: string;
  } | null>(null);

  // Store
  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);

  // Boards data
  const { 
    boards,
    refetch: refetchBoards,
  } = useMyBoardsForPin(pinId, { enabled: isAuthenticated });

  // Mutations
  const { savePinToBoard, isLoading: isSavingToBoard } = useSavePinToBoard({
    showToast: true,
    onSuccess: (boardId, boardName) => {
      setLocalSaveInfo({ boardId, boardName });
      void refetchBoards();
    },
  });

  const { unsavePin, isLoading: isUnsaving } = useUnsavePin({
    showToast: true,
    onSuccess: () => {
      setLocalSaveInfo(null);
      void refetchBoards();
    },
  });

  const isLoading = isSavingToBoard || isUnsaving;

  // ✅ Используем isPinSaved из утилит
  const isSaved = useMemo(() => {
    if (localSaveInfo !== null) return true;
    return isPinSaved({ savedToBoardsCount } as PinResponse);
  }, [localSaveInfo, savedToBoardsCount]);

  // Определяем актуальную информацию о сохранении
  const currentSaveInfo = useMemo(() => {
    if (localSaveInfo) {
      return localSaveInfo;
    }
    if (lastSavedBoardId && lastSavedBoardName) {
      return { boardId: lastSavedBoardId, boardName: lastSavedBoardName };
    }
    // Попробуем найти в списке досок
    const savedBoard = boards.find(b => b.hasPin);
    if (savedBoard) {
      return { boardId: savedBoard.id, boardName: savedBoard.title };
    }
    return null;
  }, [localSaveInfo, lastSavedBoardId, lastSavedBoardName, boards]);

  // Актуальное количество
  const currentSavedCount = localSaveInfo 
    ? savedToBoardsCount + 1 
    : savedToBoardsCount;

  // ==================== Handlers ====================

  const handleQuickSave = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (!selectedBoard) {
      return;
    }

    const alreadySaved = boards.find(b => b.id === selectedBoard.id)?.hasPin;
    if (alreadySaved) {
      return;
    }

    savePinToBoard({ boardId: selectedBoard.id, pinId });
  }, [isAuthenticated, login, selectedBoard, boards, savePinToBoard, pinId]);

  const handleUnsave = useCallback(() => {
    unsavePin(pinId);
  }, [unsavePin, pinId]);

  const handleBoardSelect = useCallback((board: BoardResponse) => {
    if (!isSaved) {
      savePinToBoard({ boardId: board.id, pinId });
    }
  }, [isSaved, savePinToBoard, pinId]);

  // ==================== Render ====================

  // Already saved
  if (isSaved && currentSaveInfo) {
    const displayText = currentSavedCount > 1 
      ? `${currentSaveInfo.boardName} +${currentSavedCount - 1}` 
      : currentSaveInfo.boardName;

    return (
      <Flex alignItems="center" gap={3}>
        {/* Saved location badge with link */}
        <Link 
          to={buildPath.board(currentSaveInfo.boardId)} 
          style={{ textDecoration: 'none' }}
        >
          <Box
            paddingX={3}
            paddingY={2}
            rounding={2}
            color="secondary"
            dangerouslySetInlineStyle={{
              __style: {
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              },
            }}
          >
            <Flex alignItems="center" gap={2}>
              <Icon accessibilityLabel="" icon="board" size={16} color="default" />
              <Text size="200" weight="bold" lineClamp={1}>
                {displayText}
              </Text>
            </Flex>
          </Box>
        </Link>
        
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