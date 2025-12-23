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
  Checkbox,
} from 'gestalt';
import { useAuth } from '@/modules/auth';
import { 
  useMyBoardsForPin, 
  useSavePinToBoard,
  useRemovePinFromBoard,
  useSelectedBoard,
  BoardCreateModal,
} from '@/modules/board';
import { useBoardPins } from '@/modules/board/hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';
import { useToast } from '@/shared/hooks/useToast';
import type { BoardWithPinStatusResponse } from '@/modules/board';

interface PinSaveButtonProps {
  pinId: string;
  isSaved: boolean;
  savedToBoardName?: string | null;
  savedToBoardCount?: number;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  variant?: 'button' | 'icon';
}

const getBoardItemBackground = (hasPin: boolean, isDefault: boolean): string => {
  if (hasPin) {
    return 'rgba(230, 0, 35, 0.08)';
  }
  if (isDefault) {
    return 'rgba(0, 0, 0, 0.04)';
  }
  return 'transparent';
};

const renderBoardItemStatus = (
  isProcessing: boolean,
  hasPin: boolean
): React.ReactNode => {
  if (isProcessing) {
    return <Spinner accessibilityLabel="Processing" show size="sm" />;
  }
  
  if (hasPin) {
    return <Icon accessibilityLabel="Saved" icon="check" size={16} color="success" />;
  }
  
  return null;
};

// Board item with save status
const SaveBoardItem: React.FC<{
  board: BoardWithPinStatusResponse;
  isDefault: boolean;
  onToggle: (board: BoardWithPinStatusResponse) => void;
  isProcessing: boolean;
}> = ({ board, isDefault, onToggle, isProcessing }) => {
  const { pins } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  const backgroundColor = getBoardItemBackground(board.hasPin, isDefault);

  return (
    <TapArea onTap={() => onToggle(board)} rounding={2} disabled={isProcessing}>
      <Box
        paddingY={2}
        paddingX={2}
        rounding={2}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'all 0.15s ease',
            backgroundColor, 
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Checkbox */}
          <Checkbox
            id={`board-${board.id}`}
            checked={board.hasPin}
            onChange={() => onToggle(board)}
            size="sm"
          />

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

          {/* Board Info */}
          <Box flex="grow">
            <Flex direction="column">
              <Text weight={board.hasPin ? 'bold' : 'normal'} size="200" lineClamp={1}>
                {board.title}
              </Text>
              <Flex gap={1} alignItems="center">
                <Text color="subtle" size="100">
                  {board.pinCount} pins
                </Text>
                {isDefault && (
                  <>
                    <Text color="subtle" size="100">•</Text>
                    <Text color="success" size="100">Default</Text>
                  </>
                )}
              </Flex>
            </Flex>
          </Box>

          {/* Status indicator */}
          {renderBoardItemStatus(isProcessing, board.hasPin)}
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
  savedToBoardName,
  savedToBoardCount = 0,
  size = 'md',
  fullWidth = false,
  variant = 'button',
}) => {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingBoardId, setProcessingBoardId] = useState<string | null>(null);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  // Используем новый хук для получения досок с состоянием пина
  const { 
    boards, 
    boardsWithPin,
    isLoading: isBoardsLoading,
    refetch: refetchBoards,
  } = useMyBoardsForPin(pinId, { enabled: isOpen });
  
  const { selectedBoard } = useSelectedBoard();
  
  const { savePinToBoard } = useSavePinToBoard({
    onSuccess: () => {
      setProcessingBoardId(null);
      void refetchBoards();
    },
    onError: () => {
      setProcessingBoardId(null);
    },
    showToast: false, // Мы сами показываем toast
  });

  const { removePinFromBoard } = useRemovePinFromBoard({
    onSuccess: () => {
      setProcessingBoardId(null);
      void refetchBoards();
    },
    onError: () => {
      setProcessingBoardId(null);
    },
    showToast: false,
  });

  const iconButtonSize = useMemo(() => getIconButtonSize(size), [size]);

  // Filter boards by search
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(b => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  // Toggle save/unsave for a board
  const handleBoardToggle = useCallback((board: BoardWithPinStatusResponse) => {
    setProcessingBoardId(board.id);
    
    if (board.hasPin) {
      removePinFromBoard({ boardId: board.id, pinId });
      toast.success(`Removed from "${board.title}"`);
    } else {
      savePinToBoard({ boardId: board.id, pinId });
      toast.success(`Saved to "${board.title}"`);
    }
  }, [removePinFromBoard, savePinToBoard, pinId, toast]);

  // Quick save to default board
  const handleQuickSave = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    // Если нет выбранной доски - открываем dropdown
    if (!selectedBoard) {
      setIsOpen(true);
      return;
    }

    // Проверяем, сохранён ли уже в default board
    const defaultBoardStatus = boards.find(b => b.id === selectedBoard.id);
    
    if (defaultBoardStatus?.hasPin) {
      // Уже сохранён - открываем dropdown для управления
      setIsOpen(true);
    } else {
      // Сохраняем в default board
      setProcessingBoardId(selectedBoard.id);
      savePinToBoard({ boardId: selectedBoard.id, pinId });
      toast.success(`Saved to "${selectedBoard.title}"`);
    }
  }, [isAuthenticated, login, selectedBoard, boards, savePinToBoard, pinId, toast]);

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
    savePinToBoard({ boardId, pinId });
    setShowCreateModal(false);
    toast.success('Saved to new board!');
  }, [savePinToBoard, pinId, toast]);

  const setAnchorRef = useCallback((node: HTMLElement | null) => {
    setAnchorElement(node);
  }, []);

  const isProcessing = processingBoardId !== null;

  // Button text
  const buttonText = useMemo(() => {
    if (isProcessing) return 'Saving...';
    
    if (isSaved && savedToBoardCount > 0) {
      if (savedToBoardCount === 1 && savedToBoardName) {
        const truncated = savedToBoardName.length > 10 
          ? savedToBoardName.slice(0, 10) + '...' 
          : savedToBoardName;
        return `Saved to ${truncated}`;
      }
      return `Saved to ${savedToBoardCount} boards`;
    }
    
    if (selectedBoard) {
      const truncated = selectedBoard.title.length > 10 
        ? selectedBoard.title.slice(0, 10) + '...' 
        : selectedBoard.title;
      return `Save to ${truncated}`;
    }
    
    return 'Save';
  }, [isProcessing, isSaved, savedToBoardCount, savedToBoardName, selectedBoard]);

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
              <SaveDropdownContent
                boards={filteredBoards}
                selectedBoard={selectedBoard}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onBoardToggle={handleBoardToggle}
                onCreateNew={() => { setIsOpen(false); setShowCreateModal(true); }}
                processingBoardId={processingBoardId}
                isLoading={isBoardsLoading}
                showSearch={boards.length > 4}
                savedCount={boardsWithPin.length}
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

  // Button variant with dropdown trigger
  return (
    <>
      <Flex alignItems="center" gap={0}>
        {/* Main save button */}
        <Button
          text={buttonText}
          onClick={handleQuickSave}
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
            accessibilityLabel="Choose boards"
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
            <SaveDropdownContent
              boards={filteredBoards}
              selectedBoard={selectedBoard}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onBoardToggle={handleBoardToggle}
              onCreateNew={() => { setIsOpen(false); setShowCreateModal(true); }}
              processingBoardId={processingBoardId}
              isLoading={isBoardsLoading}
              showSearch={boards.length > 4}
              savedCount={boardsWithPin.length}
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
const SaveDropdownContent: React.FC<{
  boards: BoardWithPinStatusResponse[];
  selectedBoard: { id: string; title: string } | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBoardToggle: (board: BoardWithPinStatusResponse) => void;
  onCreateNew: () => void;
  processingBoardId: string | null;
  isLoading: boolean;
  showSearch: boolean;
  savedCount: number;
}> = ({
  boards,
  selectedBoard,
  searchQuery,
  onSearchChange,
  onBoardToggle,
  onCreateNew,
  processingBoardId,
  isLoading,
  showSearch,
  savedCount,
}) => {
  return (
    <Box padding={3} width={300}>
      {/* Header */}
      <Box marginBottom={2}>
        <Flex justifyContent="between" alignItems="center">
          <Text weight="bold" size="300">
            Save to board
          </Text>
          {savedCount > 0 && (
            <Box 
              color="successBase" 
              rounding="pill" 
              paddingX={2} 
              paddingY={1}
            >
              <Text size="100" color="inverse">
                {savedCount} saved
              </Text>
            </Box>
          )}
        </Flex>
        <Text color="subtle" size="100">
          Select boards to save this pin
        </Text>
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
          <Box maxHeight={260} overflow="scrollY">
            <Flex direction="column" gap={1}>
              {boards.map((board) => (
                <SaveBoardItem
                  key={board.id}
                  board={board}
                  isDefault={selectedBoard?.id === board.id}
                  onToggle={onBoardToggle}
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