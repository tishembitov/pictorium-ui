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
} from 'gestalt';
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
import { useToast } from '@/shared/hooks/useToast';
import type { BoardWithPinStatusResponse } from '@/modules/board';

interface CompactSaveSectionProps {
  pinId: string;
  isSaved: boolean;
  lastSavedBoardName?: string | null;
}

export const CompactSaveSection: React.FC<CompactSaveSectionProps> = ({
  pinId,
  isSaved,
  lastSavedBoardName,
}) => {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);

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
    onSuccess: () => void refetchBoards(),
  });

  const { unsavePin, isLoading: isUnsaving } = useUnsavePin({
    showToast: false,
  });

  const isLoading = isSavingToBoard || isUnsaving;

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

    // If no selected board, open dropdown to choose
    if (!selectedBoard) {
      setIsOpen(true);
      return;
    }

    // Check if already saved to this board
    const alreadySaved = boards.find(b => b.id === selectedBoard.id)?.hasPin;
    if (alreadySaved) {
      // Open dropdown to choose another board
      setIsOpen(true);
      return;
    }

    // Quick save to selected board
    savePinToBoard({ boardId: selectedBoard.id, pinId });
    toast.success(`Saved to "${selectedBoard.title}"`);
  }, [isAuthenticated, login, selectedBoard, boards, savePinToBoard, pinId, toast]);

  const handleUnsaveClick = useCallback(() => {
    unsavePin(pinId);
  }, [unsavePin, pinId]);

  const handleBoardSelect = useCallback((board: BoardWithPinStatusResponse) => {
    if (board.hasPin) return;
    
    savePinToBoard({ boardId: board.id, pinId });
    selectBoard(board.id); // Make this the new default
    toast.success(`Saved to "${board.title}"`);
    setIsOpen(false);
  }, [savePinToBoard, pinId, selectBoard, toast]);

  const handleCreateNew = useCallback(() => {
    setIsOpen(false);
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback((boardId: string) => {
    savePinToBoard({ boardId, pinId });
    selectBoard(boardId);
    toast.success('Saved to new board!');
    setShowCreateModal(false);
  }, [savePinToBoard, pinId, selectBoard, toast]);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  // Callback ref для anchor
  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchorElement(node);
  }, []);

  // ==================== Render ====================

  // Already saved - show location + Saved button
  if (isSaved) {
    return (
      <Flex alignItems="center" gap={2}>
        {/* Saved board name badge */}
        {lastSavedBoardName && (
          <Box
            paddingX={2}
            paddingY={1}
            rounding="pill"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: 'rgba(255,255,255,0.9)',
                maxWidth: 100,
              },
            }}
          >
            <Text size="100" weight="bold" lineClamp={1} color="dark">
              {lastSavedBoardName}
            </Text>
          </Box>
        )}
        
        {/* Saved button */}
        <TapArea onTap={handleUnsaveClick} rounding="pill" disabled={isLoading}>
          <Box
            paddingX={3}
            paddingY={2}
            rounding="pill"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: '#111',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'wait' : 'pointer',
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

  // Not saved - Save button (with dropdown on click if no selected board)
  return (
    <>
      <Box ref={setAnchorRef}>
        <TapArea onTap={handleSaveClick} rounding="pill" disabled={isLoading}>
          <Box
            paddingX={4}
            paddingY={2}
            rounding="pill"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: '#e60023',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'wait' : 'pointer',
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

              {/* Search (if many boards) */}
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