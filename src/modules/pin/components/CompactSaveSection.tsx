// src/modules/pin/components/CompactSaveSection.tsx

import React, { useCallback, useMemo, useState } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  TapArea, 
  Spinner,
  Popover,
  Layer,
  SearchField,
  Divider,
  Button,
  Icon,
} from 'gestalt';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { 
  useMyBoardsForPin, 
  useSavePinToBoard,
  BoardItem,
  BoardCreateModal,
  useSelectedBoardStore,
  useSelectBoard,
} from '@/modules/board';
import { useUnsavePin } from '../hooks/useUnsavePin';
import { buildPath } from '@/app/router/routeConfig';
import { isPinSaved } from '../utils/pinUtils';
import type { BoardWithPinStatusResponse } from '@/modules/board';
import type { PinResponse } from '../types/pin.types';

interface CompactSaveSectionProps {
  pinId: string;
  lastSavedBoardId: string | null;
  lastSavedBoardName: string | null;
  savedToBoardsCount: number;
}

export const CompactSaveSection: React.FC<CompactSaveSectionProps> = ({
  pinId,
  lastSavedBoardId,
  lastSavedBoardName,
  savedToBoardsCount,
}) => {
  const { isAuthenticated, login } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);
  
  // Локальное состояние для немедленного отображения после сохранения
  const [localSaveInfo, setLocalSaveInfo] = useState<{
    boardId: string;
    boardName: string;
  } | null>(null);

  // Store
  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  const { selectBoard } = useSelectBoard();

  // Boards data
  const { 
    boards,
    isLoading: isBoardsLoading,
    refetch: refetchBoards,
  } = useMyBoardsForPin(pinId, { enabled: isAuthenticated && isOpen });

  // Mutations
  const { savePinToBoard, isLoading: isSavingToBoard } = useSavePinToBoard({
    showToast: false,
    onSuccess: (boardId, boardName) => {
      setLocalSaveInfo({ boardId, boardName });
      void refetchBoards();
      setIsOpen(false);
    },
  });

  const { unsavePin, isLoading: isUnsaving } = useUnsavePin({
    showToast: false,
    onSuccess: () => {
      setLocalSaveInfo(null);
    },
  });

  const isLoading = isSavingToBoard || isUnsaving;

  // ✅ Используем isPinSaved из утилит + локальное состояние
  const isSaved = useMemo(() => {
    if (localSaveInfo !== null) return true;
    // Создаем минимальный объект для проверки
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
    return null;
  }, [localSaveInfo, lastSavedBoardId, lastSavedBoardName]);

  // Актуальное количество сохранений
  const currentSavedCount = localSaveInfo 
    ? savedToBoardsCount + 1 
    : savedToBoardsCount;

  // Filter boards
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(b => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  // ==================== Handlers ====================

  const handleSaveClick = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (!selectedBoard) {
      setIsOpen(true);
      return;
    }

    const alreadySaved = boards.find(b => b.id === selectedBoard.id)?.hasPin;
    if (alreadySaved) {
      setIsOpen(true);
      return;
    }

    savePinToBoard({ boardId: selectedBoard.id, pinId });
  }, [isAuthenticated, login, selectedBoard, boards, savePinToBoard, pinId]);

  const handleUnsaveClick = useCallback(() => {
    unsavePin(pinId);
  }, [unsavePin, pinId]);

  const handleBoardSelect = useCallback((board: BoardWithPinStatusResponse) => {
    if (board.hasPin) return;
    
    savePinToBoard({ boardId: board.id, pinId });
    selectBoard(board.id);
  }, [savePinToBoard, pinId, selectBoard]);

  const handleCreateNew = useCallback(() => {
    setIsOpen(false);
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback((boardId: string) => {
    savePinToBoard({ boardId, pinId });
    selectBoard(boardId);
    setShowCreateModal(false);
  }, [savePinToBoard, pinId, selectBoard]);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchorElement(node);
  }, []);

  // ==================== Render ====================

  // Already saved - show location + Saved button
  if (isSaved && currentSaveInfo) {
    return (
      <Flex alignItems="center" gap={2}>
        {/* Saved board name badge with link */}
        <Link 
          to={buildPath.board(currentSaveInfo.boardId)} 
          style={{ textDecoration: 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box
            paddingX={2}
            paddingY={1}
            rounding="pill"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: 'rgba(255,255,255,0.95)',
                maxWidth: 120,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              },
            }}
          >
            <Flex alignItems="center" gap={1}>
              <Icon accessibilityLabel="" icon="board" size={12} color="dark" />
              <Text size="100" weight="bold" lineClamp={1} color="dark">
                {currentSaveInfo.boardName}
              </Text>
              {currentSavedCount > 1 && (
                <Text size="100" color="subtle">
                  +{currentSavedCount - 1}
                </Text>
              )}
            </Flex>
          </Box>
        </Link>
        
        {/* Saved button */}
        <TapArea 
          onTap={handleUnsaveClick} 
          rounding="pill" 
          disabled={isLoading}
          tapStyle="compress"
        >
          <Box
            paddingX={3}
            paddingY={2}
            rounding="pill"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: '#111',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'wait' : 'pointer',
                transition: 'all 0.15s ease',
              },
            }}
          >
            {isLoading ? (
              <Spinner accessibilityLabel="Processing" show size="sm" />
            ) : (
              <Text color="inverse" weight="bold" size="200">
                Saved
              </Text>
            )}
          </Box>
        </TapArea>
      </Flex>
    );
  }

  // Not saved - Save button
  return (
    <>
      <Box ref={setAnchorRef}>
        <TapArea 
          onTap={handleSaveClick} 
          rounding="pill" 
          disabled={isLoading}
          tapStyle="compress"
        >
          <Box
            paddingX={4}
            paddingY={2}
            rounding="pill"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: '#e60023',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'wait' : 'pointer',
                transition: 'all 0.15s ease',
              },
            }}
          >
            {isLoading ? (
              <Spinner accessibilityLabel="Processing" show size="sm" />
            ) : (
              <Text color="inverse" weight="bold" size="200">
                Save
              </Text>
            )}
          </Box>
        </TapArea>
      </Box>

      {/* Board selection dropdown */}
      {isOpen && anchorElement && (
        <Layer>
          <Popover
            anchor={anchorElement}
            onDismiss={handleDismiss}
            idealDirection="down"
            positionRelativeToAnchor={false}
            size="flexible"
            color="white"
          >
            <Box padding={3} width={280}>
              {/* Header */}
              <Box marginBottom={2}>
                <Text weight="bold" size="300" align="center">
                  Save to board
                </Text>
              </Box>

              {/* Search */}
              {boards.length > 5 && (
                <Box marginBottom={2}>
                  <SearchField
                    id={`compact-save-search-${pinId}`}
                    accessibilityLabel="Search boards"
                    accessibilityClearButtonLabel="Clear"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={({ value }) => setSearchQuery(value)}
                    size="md"
                  />
                </Box>
              )}

              {/* Boards List */}
              <Box maxHeight={200} overflow="scrollY">
                {isBoardsLoading ? (
                  <Box display="flex" justifyContent="center" padding={4}>
                    <Spinner accessibilityLabel="Loading" show size="sm" />
                  </Box>
                ) : (
                  <Flex direction="column" gap={1}>
                    {filteredBoards.map((board) => (
                      <BoardItem
                        key={board.id}
                        board={board}
                        isSelected={selectedBoard?.id === board.id}
                        onSelect={() => handleBoardSelect(board)}
                        isProcessing={isLoading}
                        size="sm"
                      />
                    ))}

                    {filteredBoards.length === 0 && (
                      <Box padding={3}>
                        <Text align="center" color="subtle" size="100">
                          {searchQuery ? 'No boards found' : 'No boards yet'}
                        </Text>
                      </Box>
                    )}
                  </Flex>
                )}
              </Box>

              <Divider />

              {/* Create Board */}
              <Box marginTop={2}>
                <Button
                  text="Create board"
                  onClick={handleCreateNew}
                  size="md"
                  color="gray"
                  fullWidth
                  iconEnd="add"
                />
              </Box>
            </Box>
          </Popover>
        </Layer>
      )}

      {/* Create Board Modal */}
      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default CompactSaveSection;