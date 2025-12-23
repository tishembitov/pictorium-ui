// src/modules/pin/components/PinSaveButton.tsx

import React, { useCallback, useState } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  TapArea, 
  Icon,
  Spinner,
  SearchField,
  Divider,
  Popover,
  Layer,
} from 'gestalt';
import { useAuth } from '@/modules/auth';
import { 
  useMyBoardsForPin, 
  useSavePinToBoard,
  useRemovePinFromAllBoards,
  BoardCreateModal,
} from '@/modules/board';
import { useBoardPins } from '@/modules/board/hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';
import { useToast } from '@/shared/hooks/useToast';
import type { BoardWithPinStatusResponse } from '@/modules/board';

interface PinSaveButtonProps {
  pinId: string;
  isSaved: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Type alias for button sizes
type ButtonSize = 'sm' | 'md' | 'lg';

// Gestalt Padding type
type GestaltPadding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// Helper functions with proper return types
const getPaddingX = (size: ButtonSize): GestaltPadding => {
  switch (size) {
    case 'sm': return 3;
    case 'lg': return 5;
    default: return 4;
  }
};

const getPaddingY = (size: ButtonSize): GestaltPadding => {
  switch (size) {
    case 'sm': return 2;
    case 'lg': return 3;
    default: return 2;
  }
};

const getTextSize = (size: ButtonSize): '200' | '300' | '400' => {
  switch (size) {
    case 'sm': return '200';
    case 'lg': return '400';
    default: return '300';
  }
};

const getMinWidth = (size: ButtonSize): number => {
  return size === 'lg' ? 80 : 60;
};

// Board item component
const BoardItem: React.FC<{
  board: BoardWithPinStatusResponse;
  onSelect: (board: BoardWithPinStatusResponse) => void;
  isProcessing: boolean;
}> = ({ board, onSelect, isProcessing }) => {
  const { pins } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  return (
    <TapArea onTap={() => onSelect(board)} rounding={2} disabled={isProcessing}>
      <Box
        paddingY={2}
        paddingX={3}
        rounding={2}
        color={board.hasPin ? 'secondary' : 'transparent'}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'background-color 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Cover */}
          <Box
            width={48}
            height={48}
            rounding={2}
            overflow="hidden"
            color="secondary"
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: coverData?.url ? {
                backgroundImage: `url(${coverData.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {},
            }}
          >
            {!coverData?.url && (
              <Icon accessibilityLabel="" icon="board" size={20} color="subtle" />
            )}
          </Box>

          {/* Info */}
          <Box flex="grow">
            <Text weight="bold" size="200" lineClamp={1}>
              {board.title}
            </Text>
            <Text color="subtle" size="100">
              {board.pinCount} pins
            </Text>
          </Box>

          {/* Status */}
          {isProcessing && (
            <Spinner accessibilityLabel="Saving" show size="sm" />
          )}
          {!isProcessing && board.hasPin && (
            <Icon accessibilityLabel="Saved" icon="check" size={20} color="dark" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

// Filtered boards hook
const useFilteredBoards = (
  boards: BoardWithPinStatusResponse[],
  searchQuery: string
): BoardWithPinStatusResponse[] => {
  if (!searchQuery.trim()) return boards;
  const query = searchQuery.toLowerCase();
  return boards.filter(b => b.title.toLowerCase().includes(query));
};

export const PinSaveButton: React.FC<PinSaveButtonProps> = ({
  pinId,
  isSaved,
  size = 'md',
}) => {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingBoardId, setProcessingBoardId] = useState<string | null>(null);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const { 
    boards, 
    boardsWithPin,
    isLoading: isBoardsLoading,
    refetch: refetchBoards,
  } = useMyBoardsForPin(pinId, { enabled: isOpen });
  
  const { savePinToBoard } = useSavePinToBoard({
    onSuccess: () => {
      setProcessingBoardId(null);
      setIsOpen(false);
      void refetchBoards();
    },
    onError: () => {
      setProcessingBoardId(null);
    },
    showToast: false,
  });

  const { removePinFromAllBoards, isLoading: isRemoving } = useRemovePinFromAllBoards({
    showToast: false,
  });

  const filteredBoards = useFilteredBoards(boards, searchQuery);

  const handleButtonClick = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (isSaved) {
      removePinFromAllBoards(pinId);
      toast.success('Removed from all boards');
    } else {
      setIsOpen(true);
      setSearchQuery('');
    }
  }, [isAuthenticated, login, isSaved, removePinFromAllBoards, pinId, toast]);

  const handleBoardSelect = useCallback((board: BoardWithPinStatusResponse) => {
    if (board.hasPin) return;
    
    setProcessingBoardId(board.id);
    savePinToBoard({ boardId: board.id, pinId });
    toast.success(`Saved to "${board.title}"`);
  }, [savePinToBoard, pinId, toast]);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleCreateSuccess = useCallback((boardId: string) => {
    setProcessingBoardId(boardId);
    savePinToBoard({ boardId, pinId });
    setShowCreateModal(false);
    toast.success('Saved to new board!');
  }, [savePinToBoard, pinId, toast]);

  const handleOpenCreateModal = useCallback(() => {
    setIsOpen(false);
    setShowCreateModal(true);
  }, []);

  const setAnchorRef = useCallback((node: HTMLElement | null) => {
    setAnchorElement(node);
  }, []);

  // Computed values
  const paddingX = getPaddingX(size);
  const paddingY = getPaddingY(size);
  const textSize = getTextSize(size);
  const minWidth = getMinWidth(size);
  const isProcessing = processingBoardId !== null || isRemoving;
  const backgroundColor = isSaved ? '#111111' : '#e60023';
  const buttonText = isSaved ? 'Saved' : 'Save';
  const showSearch = boards.length > 5;

  return (
    <>
      {/* Pinterest-style Save Button */}
      <Box ref={setAnchorRef}>
        <TapArea 
          onTap={handleButtonClick} 
          rounding="pill"
          disabled={isProcessing}
        >
          <Box
            paddingX={paddingX}
            paddingY={paddingY}
            rounding="pill"
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor,
                transition: 'all 0.2s ease',
                cursor: isProcessing ? 'wait' : 'pointer',
                opacity: isProcessing ? 0.7 : 1,
                minWidth,
              },
            }}
          >
            {isProcessing ? (
              <Spinner accessibilityLabel="Processing" show size="sm" />
            ) : (
              <Text color="inverse" weight="bold" size={textSize}>
                {buttonText}
              </Text>
            )}
          </Box>
        </TapArea>
      </Box>

      {/* Board Picker Popover */}
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
            <Box padding={3} width={320}>
              {/* Header */}
              <Box marginBottom={3}>
                <Text weight="bold" size="300" align="center">
                  Save to board
                </Text>
              </Box>

              {/* Search */}
              {showSearch && (
                <Box marginBottom={3}>
                  <SearchField
                    id="save-board-search"
                    accessibilityLabel="Search boards"
                    accessibilityClearButtonLabel="Clear"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={({ value }) => setSearchQuery(value)}
                    size="md"
                  />
                </Box>
              )}

              {/* Board List */}
              <Box maxHeight={300} overflow="scrollY">
                {isBoardsLoading ? (
                  <Box display="flex" justifyContent="center" padding={4}>
                    <Spinner accessibilityLabel="Loading boards" show size="md" />
                  </Box>
                ) : (
                  <Flex direction="column" gap={1}>
                    {filteredBoards.map((board) => (
                      <BoardItem
                        key={board.id}
                        board={board}
                        onSelect={handleBoardSelect}
                        isProcessing={processingBoardId === board.id}
                      />
                    ))}

                    {filteredBoards.length === 0 && (
                      <Box padding={4}>
                        <Text align="center" color="subtle">
                          {searchQuery ? 'No boards found' : 'No boards yet'}
                        </Text>
                      </Box>
                    )}
                  </Flex>
                )}
              </Box>

              <Divider />

              {/* Create Board */}
              <Box marginTop={3}>
                <TapArea onTap={handleOpenCreateModal} rounding={2}>
                  <Box padding={3} rounding={2}>
                    <Flex alignItems="center" gap={3}>
                      <Box
                        width={48}
                        height={48}
                        rounding={2}
                        color="secondary"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon accessibilityLabel="" icon="add" size={24} />
                      </Box>
                      <Text weight="bold" size="200">
                        Create board
                      </Text>
                    </Flex>
                  </Box>
                </TapArea>
              </Box>

              {/* Saved count info */}
              {boardsWithPin.length > 0 && (
                <Box marginTop={2} paddingX={3}>
                  <Text size="100" color="subtle" align="center">
                    Saved to {boardsWithPin.length} {boardsWithPin.length === 1 ? 'board' : 'boards'}
                  </Text>
                </Box>
              )}
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

export default PinSaveButton;