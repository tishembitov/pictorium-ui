// src/modules/pin/components/PinSaveButton.tsx

import React, { useCallback, useMemo, useState } from 'react';
import { 
  Button, 
  IconButton, 
  Popover, 
  Layer, 
  Box, 
  Flex, 
  Text, 
  TapArea, 
  Icon,
  Spinner,
  SearchField,
  Divider,
} from 'gestalt';
import { useAuth } from '@/modules/auth';
import { useMyBoards, useAddPinToBoard, useRemovePinFromBoard, useSelectedBoard, BoardCreateModal } from '@/modules/board';
import { useBoardPins } from '@/modules/board/hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';
import { useToast } from '@/shared/hooks/useToast';
import type { BoardResponse } from '@/modules/board';

interface PinSaveButtonProps {
  pinId: string;
  isSaved: boolean;
  savedBoardId?: string | null; // ID доски, в которой сохранен пин
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  variant?: 'button' | 'icon';
  onSaveChange?: (isSaved: boolean, boardId?: string) => void;
}

// Mini board item for quick save
const QuickSaveBoardItem: React.FC<{
  board: BoardResponse;
  isDefault: boolean;
  isSavedHere: boolean;
  onSelect: () => void;
  isProcessing: boolean;
}> = ({ board, isDefault, isSavedHere, onSelect, isProcessing }) => {
  const { pins } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  return (
    <TapArea onTap={onSelect} rounding={2} disabled={isProcessing}>
      <Box
        paddingY={2}
        paddingX={2}
        rounding={2}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'all 0.15s ease',
            backgroundColor: isSavedHere 
              ? 'rgba(230, 0, 35, 0.08)' 
              : isDefault 
                ? 'rgba(0, 0, 0, 0.04)' 
                : 'transparent',
          },
        }}
      >
        <Flex alignItems="center" gap={2}>
          {/* Mini Cover */}
          <Box
            width={40}
            height={40}
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
              <Icon accessibilityLabel="" icon="board" size={16} color="subtle" />
            )}
          </Box>

          {/* Title */}
          <Box flex="grow">
            <Flex direction="column">
              <Text weight="bold" size="200" lineClamp={1}>
                {board.title}
              </Text>
              <Flex gap={1}>
                {isDefault && (
                  <Text color="subtle" size="100">
                    Default
                  </Text>
                )}
                {isSavedHere && (
                  <Text color="success" size="100">
                    {isDefault ? ' • ' : ''}Saved
                  </Text>
                )}
              </Flex>
            </Flex>
          </Box>

          {/* Action indicator */}
          {isProcessing ? (
            <Spinner accessibilityLabel="Processing" show size="sm" />
          ) : isSavedHere ? (
            <Icon accessibilityLabel="Saved" icon="check" size={16} color="success" />
          ) : (
            <Icon accessibilityLabel="" icon="add" size={14} color="subtle" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

const getIconButtonSize = (size: 'sm' | 'md' | 'lg'): 'xs' | 'md' | 'lg' => {
  if (size === 'sm') return 'xs';
  if (size === 'lg') return 'lg';
  return 'md';
};

export const PinSaveButton: React.FC<PinSaveButtonProps> = ({
  pinId,
  isSaved,
  savedBoardId,
  size = 'md',
  fullWidth = false,
  variant = 'button',
  onSaveChange,
}) => {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingBoardId, setProcessingBoardId] = useState<string | null>(null);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const { boards, isLoading: isBoardsLoading } = useMyBoards();
  const { selectedBoard } = useSelectedBoard();
  
  const { addPinToBoard } = useAddPinToBoard({
    onSuccess: () => {
      setProcessingBoardId(null);
      setIsOpen(false);
    },
    onError: () => {
      setProcessingBoardId(null);
    },
  });

  const { removePinFromBoard } = useRemovePinFromBoard({
    onSuccess: () => {
      setProcessingBoardId(null);
      setIsOpen(false);
    },
    onError: () => {
      setProcessingBoardId(null);
    },
  });

  const iconButtonSize = useMemo(() => getIconButtonSize(size), [size]);

  // Filter boards
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(b => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  // Handle save/unsave toggle
  const handleBoardAction = useCallback((board: BoardResponse) => {
    const isSavedInThisBoard = savedBoardId === board.id;
    
    setProcessingBoardId(board.id);
    
    if (isSavedInThisBoard) {
      // Unsave from this board
      removePinFromBoard({ boardId: board.id, pinId });
      toast.success(`Removed from "${board.title}"`);
      onSaveChange?.(false, undefined);
    } else {
      // Save to this board
      addPinToBoard({ boardId: board.id, pinId });
      toast.success(`Saved to "${board.title}"`);
      onSaveChange?.(true, board.id);
    }
  }, [savedBoardId, removePinFromBoard, addPinToBoard, pinId, toast, onSaveChange]);

  // Quick save/unsave to default board
  const handleQuickAction = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    // If already saved - unsave
    if (isSaved && savedBoardId) {
      const savedBoard = boards.find(b => b.id === savedBoardId);
      if (savedBoard) {
        setProcessingBoardId(savedBoardId);
        removePinFromBoard({ boardId: savedBoardId, pinId });
        toast.success(`Removed from "${savedBoard.title}"`);
        onSaveChange?.(false, undefined);
        return;
      }
    }

    // If has default board - save there
    if (selectedBoard) {
      setProcessingBoardId(selectedBoard.id);
      addPinToBoard({ boardId: selectedBoard.id, pinId });
      toast.success(`Saved to "${selectedBoard.title}"`);
      onSaveChange?.(true, selectedBoard.id);
    } else {
      // No default board - open selector
      setIsOpen(true);
    }
  }, [isAuthenticated, login, isSaved, savedBoardId, boards, selectedBoard, removePinFromBoard, addPinToBoard, pinId, toast, onSaveChange]);

  // Open dropdown
  const handleOpenDropdown = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setIsOpen(true);
    setSearchQuery('');
  }, [isAuthenticated, login]);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleCreateSuccess = useCallback((boardId: string) => {
    setProcessingBoardId(boardId);
    addPinToBoard({ boardId, pinId });
    setShowCreateModal(false);
    toast.success('Saved to new board!');
    onSaveChange?.(true, boardId);
  }, [addPinToBoard, pinId, toast, onSaveChange]);

  const setAnchorRef = useCallback((node: HTMLElement | null) => {
    setAnchorElement(node);
  }, []);

  const isProcessing = processingBoardId !== null;

  // Get saved board name for display
  const savedBoardName = useMemo(() => {
    if (savedBoardId) {
      const board = boards.find(b => b.id === savedBoardId);
      return board?.title;
    }
    return null;
  }, [savedBoardId, boards]);

  // Icon variant
  if (variant === 'icon') {
    return (
      <>
        <IconButton
          ref={setAnchorRef as React.Ref<HTMLButtonElement>}
          accessibilityLabel={isSaved ? 'Saved - click to manage' : 'Save'}
          accessibilityExpanded={isOpen}
          accessibilityHaspopup
          icon={isSaved ? 'check' : 'add-pin'}
          size={iconButtonSize}
          bgColor={isSaved ? 'red' : 'transparentDarkGray'}
          iconColor="white"
          onClick={handleOpenDropdown}
          disabled={isProcessing}
        />

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
              <SaveToBoardDropdown
                boards={filteredBoards}
                selectedBoard={selectedBoard}
                savedBoardId={savedBoardId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onBoardAction={handleBoardAction}
                onCreateNew={() => { setIsOpen(false); setShowCreateModal(true); }}
                processingBoardId={processingBoardId}
                isLoading={isBoardsLoading}
                showSearch={boards.length > 4}
              />
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
  }

  // Button variant
  const buttonText = useMemo(() => {
    if (isProcessing) return 'Saving...';
    if (isSaved) {
      if (savedBoardName) {
        const truncated = savedBoardName.length > 12 
          ? savedBoardName.slice(0, 12) + '...' 
          : savedBoardName;
        return `Saved to ${truncated}`;
      }
      return 'Saved';
    }
    if (selectedBoard) {
      const truncated = selectedBoard.title.length > 10 
        ? selectedBoard.title.slice(0, 10) + '...' 
        : selectedBoard.title;
      return `Save to ${truncated}`;
    }
    return 'Save';
  }, [isProcessing, isSaved, savedBoardName, selectedBoard]);

  return (
    <>
      <Flex alignItems="center" gap={0}>
        {/* Main save button */}
        <Button
          text={buttonText}
          onClick={handleQuickAction}
          size={size}
          color="red"
          disabled={isProcessing}
          fullWidth={fullWidth}
        />
        
        {/* Dropdown trigger */}
        <Box
          ref={setAnchorRef}
          marginStart={-1}
          dangerouslySetInlineStyle={{
            __style: { marginLeft: '-1px' },
          }}
        >
          <IconButton
            accessibilityLabel="Choose board"
            accessibilityExpanded={isOpen}
            accessibilityHaspopup
            icon="arrow-down"
            size={size === 'sm' ? 'xs' : 'sm'}
            bgColor="red"
            iconColor="white"
            onClick={handleOpenDropdown}
          />
        </Box>
      </Flex>

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
            <SaveToBoardDropdown
              boards={filteredBoards}
              selectedBoard={selectedBoard}
              savedBoardId={savedBoardId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onBoardAction={handleBoardAction}
              onCreateNew={() => { setIsOpen(false); setShowCreateModal(true); }}
              processingBoardId={processingBoardId}
              isLoading={isBoardsLoading}
              showSearch={boards.length > 4}
            />
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

// Dropdown content component
const SaveToBoardDropdown: React.FC<{
  boards: BoardResponse[];
  selectedBoard: BoardResponse | null;
  savedBoardId?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBoardAction: (board: BoardResponse) => void;
  onCreateNew: () => void;
  processingBoardId: string | null;
  isLoading: boolean;
  showSearch: boolean;
}> = ({
  boards,
  selectedBoard,
  savedBoardId,
  searchQuery,
  onSearchChange,
  onBoardAction,
  onCreateNew,
  processingBoardId,
  isLoading,
  showSearch,
}) => {
  return (
    <Box padding={3} width={280}>
      {/* Header */}
      <Box marginBottom={2}>
        <Text weight="bold" size="300">
          {savedBoardId ? 'Saved to board' : 'Save to board'}
        </Text>
        {savedBoardId && (
          <Text color="subtle" size="100">
            Tap to remove or save to another board
          </Text>
        )}
      </Box>

      {/* Search */}
      {showSearch && (
        <Box marginBottom={2}>
          <SearchField
            id="save-board-search"
            accessibilityLabel="Search boards"
            accessibilityClearButtonLabel="Clear"
            placeholder="Search..."
            value={searchQuery}
            onChange={({ value }) => onSearchChange(value)}
            size="md"
          />
        </Box>
      )}

      {/* Create New Button */}
      <Box marginBottom={2}>
        <Button
          text="Create board"
          onClick={onCreateNew}
          size="md"
          color="gray"
          fullWidth
          iconEnd="add"
        />
      </Box>

      <Divider />

      {/* Board List */}
      <Box marginTop={2}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" padding={3}>
            <Spinner accessibilityLabel="Loading boards" show size="sm" />
          </Box>
        ) : (
          <Box maxHeight={220} overflow="scrollY">
            <Flex direction="column" gap={1}>
              {boards.map((board) => (
                <QuickSaveBoardItem
                  key={board.id}
                  board={board}
                  isDefault={selectedBoard?.id === board.id}
                  isSavedHere={savedBoardId === board.id}
                  onSelect={() => onBoardAction(board)}
                  isProcessing={processingBoardId === board.id}
                />
              ))}

              {boards.length === 0 && (
                <Box padding={3}>
                  <Text align="center" color="subtle" size="100">
                    {searchQuery ? 'No boards found' : 'No boards yet'}
                  </Text>
                </Box>
              )}
            </Flex>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PinSaveButton;