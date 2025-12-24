// src/modules/pin/components/PinSaveButton.tsx

import React, { useCallback, useState, useMemo } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  TapArea, 
  Icon,
  Spinner,
  Popover,
  Layer,
  SearchField,
  Divider,
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
import { useSelectedBoard } from '@/modules/board/hooks/useSelectedBoard';
import type { BoardWithPinStatusResponse } from '@/modules/board';

interface PinSaveButtonProps {
  pinId: string;
  isSaved: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card';
}

type ButtonSize = 'sm' | 'md' | 'lg';

// Helper functions to avoid nested ternaries
const getButtonHeight = (size: ButtonSize): number => {
  switch (size) {
    case 'lg': return 48;
    case 'sm': return 32;
    default: return 40;
  }
};

const getPaddingX = (size: ButtonSize): number => {
  switch (size) {
    case 'lg': return 20;
    case 'sm': return 12;
    default: return 16;
  }
};

// Board item in dropdown
const BoardDropdownItem: React.FC<{
  board: BoardWithPinStatusResponse;
  onSelect: (board: BoardWithPinStatusResponse) => void;
  isProcessing: boolean;
}> = ({ board, onSelect, isProcessing }) => {
  const { pins } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TapArea 
      onTap={() => onSelect(board)} 
      rounding={3} 
      disabled={isProcessing || board.hasPin}
    >
      <Box
        padding={2}
        rounding={3}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: isHovered ? '#e9e9e9' : 'transparent',
            opacity: board.hasPin ? 0.6 : 1,
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
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

          <Box flex="grow">
            <Text weight="bold" size="200" lineClamp={1}>
              {board.title}
            </Text>
            <Text color="subtle" size="100">
              {board.pinCount} pins
            </Text>
          </Box>

          {isProcessing && (
            <Spinner accessibilityLabel="Saving" show size="sm" />
          )}
          {board.hasPin && !isProcessing && (
            <Icon accessibilityLabel="Already saved" icon="check" size={16} color="subtle" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

export const PinSaveButton: React.FC<PinSaveButtonProps> = ({
  pinId,
  isSaved,
  size = 'md',
  variant = 'default',
}) => {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const { selectedBoard } = useSelectedBoard();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingBoardId, setProcessingBoardId] = useState<string | null>(null);
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { 
    boards, 
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

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(b => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  const handleDropdownToggle = useCallback((e?: { event: React.MouseEvent | React.KeyboardEvent }) => {
    e?.event.stopPropagation();
    if (!isAuthenticated) {
      login();
      return;
    }
    setIsOpen(prev => !prev);
    setSearchQuery('');
  }, [isAuthenticated, login]);

  const handleSaveClick = useCallback((e?: { event: React.MouseEvent | React.KeyboardEvent }) => {
    e?.event.stopPropagation();
    if (!isAuthenticated) {
      login();
      return;
    }

    if (isSaved) {
      removePinFromAllBoards(pinId);
      toast.success('Removed from all boards');
    } else if (selectedBoard) {
      setProcessingBoardId(selectedBoard.id);
      savePinToBoard({ boardId: selectedBoard.id, pinId });
      toast.success(`Saved to "${selectedBoard.title}"`);
    } else {
      setIsOpen(true);
    }
  }, [isAuthenticated, login, isSaved, selectedBoard, pinId, savePinToBoard, removePinFromAllBoards, toast]);

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

  // Correct ref callback type for HTMLDivElement
  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchorElement(node);
  }, []);

  const isProcessing = processingBoardId !== null || isRemoving;
  const showSearch = boards.length > 5;

  // Use helper functions instead of nested ternaries
  const buttonHeight = getButtonHeight(size);
  const paddingX = getPaddingX(size);

  // Card variant - compact save button for PinCard hover overlay
  if (variant === 'card') {
    return (
      <>
        <TapArea
          onTap={handleSaveClick}
          rounding="pill"
          disabled={isProcessing}
        >
          <Box
            paddingX={4}
            paddingY={2}
            rounding="pill"
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: isSaved ? '#111' : '#e60023',
                cursor: isProcessing ? 'wait' : 'pointer',
                opacity: isProcessing ? 0.8 : 1,
                transition: 'all 0.15s ease',
                minWidth: 60,
              },
            }}
          >
            {isProcessing ? (
              <Spinner accessibilityLabel="Saving" show size="sm" />
            ) : (
              <Text color="inverse" weight="bold" size="200">
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            )}
          </Box>
        </TapArea>

        <BoardCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </>
    );
  }

  // Default variant - full Pinterest-style with dropdown
  return (
    <>
      <Flex alignItems="center">
        {/* Wrapper Box with ref */}
        <Box ref={setAnchorRef} display="flex">
          {/* Board Selector Dropdown Toggle */}
          <TapArea onTap={handleDropdownToggle} rounding={2}>
            <Box
              display="flex"
              alignItems="center"
              paddingX={3}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              dangerouslySetInlineStyle={{
                __style: {
                  height: buttonHeight,
                  backgroundColor: isHovered ? '#e2e2e2' : '#efefef',
                  borderRadius: '8px 0 0 8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                },
              }}
            >
              <Flex alignItems="center" gap={2}>
                <Text size="200" weight="bold" lineClamp={1}>
                  {selectedBoard?.title || 'Profile'}
                </Text>
                <Icon 
                  accessibilityLabel="" 
                  icon="arrow-down" 
                  size={12} 
                  color="dark"
                />
              </Flex>
            </Box>
          </TapArea>

          {/* Save Button */}
          <TapArea 
            onTap={handleSaveClick} 
            disabled={isProcessing}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              dangerouslySetInlineStyle={{
                __style: {
                  height: buttonHeight,
                  paddingLeft: paddingX,
                  paddingRight: paddingX,
                  backgroundColor: isSaved ? '#111' : '#e60023',
                  borderRadius: '0 8px 8px 0',
                  cursor: isProcessing ? 'wait' : 'pointer',
                  opacity: isProcessing ? 0.7 : 1,
                  transition: 'all 0.15s ease',
                },
              }}
            >
              {isProcessing ? (
                <Spinner accessibilityLabel="Saving" show size="sm" />
              ) : (
                <Text color="inverse" weight="bold" size="300">
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              )}
            </Box>
          </TapArea>
        </Box>
      </Flex>

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
            <Box padding={4} width={360}>
              <Box marginBottom={3}>
                <Text weight="bold" size="400" align="center">
                  Save
                </Text>
              </Box>

              {showSearch && (
                <Box marginBottom={3}>
                  <SearchField
                    id="board-picker-search"
                    accessibilityLabel="Search boards"
                    accessibilityClearButtonLabel="Clear"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={({ value }) => setSearchQuery(value)}
                    size="lg"
                  />
                </Box>
              )}

              <Box maxHeight={320} overflow="scrollY">
                {isBoardsLoading ? (
                  <Box display="flex" justifyContent="center" padding={6}>
                    <Spinner accessibilityLabel="Loading boards" show />
                  </Box>
                ) : (
                  <Flex direction="column" gap={1}>
                    {filteredBoards.map((board) => (
                      <BoardDropdownItem
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

              <Box marginTop={3}>
                <TapArea 
                  onTap={() => { setIsOpen(false); setShowCreateModal(true); }}
                  rounding={3}
                >
                  <Box padding={3} rounding={3}>
                    <Flex alignItems="center" gap={3}>
                      <Box
                        width={48}
                        height={48}
                        rounding="circle"
                        color="secondary"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon accessibilityLabel="" icon="add" size={20} />
                      </Box>
                      <Text weight="bold" size="200">
                        Create board
                      </Text>
                    </Flex>
                  </Box>
                </TapArea>
              </Box>
            </Box>
          </Popover>
        </Layer>
      )}

      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default PinSaveButton;