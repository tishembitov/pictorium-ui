// src/modules/board/components/BoardPicker.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Flex, 
  Text, 
  SearchField,
  TapArea,
  Icon,
  Divider,
  Popover,
  Layer,
  Spinner,
} from 'gestalt';
import { useMyBoards } from '../hooks/useMyBoards';
import { useSelectedBoard } from '../hooks/useSelectedBoard';
import { useSelectBoard } from '../hooks/useSelectBoard';
import { BoardCreateModal } from './BoardCreateModal';
import { useBoardPins } from '../hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';
import type { BoardResponse } from '../types/board.types';

interface BoardPickerProps {
  onBoardChange?: (board: BoardResponse | null) => void;
  size?: 'sm' | 'md' | 'lg';
}

// Mini board item for picker
const BoardPickerItem: React.FC<{
  board: BoardResponse;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ board, isSelected, onSelect }) => {
  const { pins } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  return (
    <TapArea onTap={onSelect} rounding={2}>
      <Box
        paddingY={2}
        paddingX={3}
        rounding={2}
        color={isSelected ? 'secondary' : 'transparent'}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'background-color 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
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
            <Text weight={isSelected ? 'bold' : 'normal'} size="200" lineClamp={1}>
              {board.title}
            </Text>
          </Box>

          {/* Check */}
          {isSelected && (
            <Icon accessibilityLabel="Selected" icon="check" size={16} color="default" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

export const BoardPicker: React.FC<BoardPickerProps> = ({
  onBoardChange,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // ✅ Используем state вместо ref для anchor element
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null);

  const { boards, isLoading: isBoardsLoading } = useMyBoards();
  const { selectedBoard } = useSelectedBoard();
  const { selectBoard, deselectBoard } = useSelectBoard();

  // Filter boards
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(b => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setSearchQuery('');
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleBoardSelect = useCallback((board: BoardResponse) => {
    if (selectedBoard?.id === board.id) {
      deselectBoard();
      onBoardChange?.(null);
    } else {
      selectBoard(board.id);
      onBoardChange?.(board);
    }
    setIsOpen(false);
  }, [selectedBoard, selectBoard, deselectBoard, onBoardChange]);

  const handleDeselect = useCallback(() => {
    deselectBoard();
    onBoardChange?.(null);
    setIsOpen(false);
  }, [deselectBoard, onBoardChange]);

  const handleCreateNew = useCallback(() => {
    setIsOpen(false);
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback((boardId: string) => {
    selectBoard(boardId);
    setShowCreateModal(false);
  }, [selectBoard]);

  // ✅ Callback ref для установки anchor element
  const setAnchorRef = useCallback((node: HTMLButtonElement | null) => {
    setAnchorElement(node);
  }, []);

  const iconSize = useMemo((): 'xs' | 'md' | 'lg' => {
    if (size === 'sm') return 'xs';
    if (size === 'lg') return 'lg';
    return 'md';
  }, [size]);

  return (
    <>
      <Tooltip text={selectedBoard ? `Saving to: ${selectedBoard.title}` : 'Select board'}>
        <IconButton
          ref={setAnchorRef}
          accessibilityLabel="Select board"
          accessibilityExpanded={isOpen}
          accessibilityHaspopup
          icon="board"
          onClick={handleToggle}
          size={iconSize}
          bgColor={selectedBoard ? 'red' : 'transparent'}
          iconColor={selectedBoard ? 'white' : 'darkGray'}
        />
      </Tooltip>

      {isOpen && anchorElement && (
        <Layer>
          <Popover
            anchor={anchorElement}
            onDismiss={handleDismiss}
            idealDirection="down"
            positionRelativeToAnchor={false}
            size="md"
            color="white"
          >
            <Box padding={3} width={300}>
              {/* Header */}
              <Box marginBottom={3}>
                <Text weight="bold" size="300">
                  Save to board
                </Text>
              </Box>

              {/* Search */}
              {boards.length > 5 && (
                <Box marginBottom={3}>
                  <SearchField
                    id="board-picker-search"
                    accessibilityLabel="Search boards"
                    accessibilityClearButtonLabel="Clear"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={({ value }) => setSearchQuery(value)}
                    size="md"
                  />
                </Box>
              )}

              {/* Create New */}
              <TapArea onTap={handleCreateNew} rounding={2}>
                <Box paddingY={2} paddingX={3}>
                  <Flex alignItems="center" gap={3}>
                    <Box
                      width={40}
                      height={40}
                      rounding={2}
                      color="secondary"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon accessibilityLabel="" icon="add" size={16} />
                    </Box>
                    <Text weight="bold" size="200">
                      Create board
                    </Text>
                  </Flex>
                </Box>
              </TapArea>

              {/* ✅ Обёрнут Divider в Box для margin */}
              <Box marginTop={2} marginBottom={2}>
                <Divider />
              </Box>

              {/* Board List */}
              {isBoardsLoading ? (
                <Box display="flex" justifyContent="center" padding={4}>
                  <Spinner accessibilityLabel="Loading boards" show size="sm" />
                </Box>
              ) : (
                <Box 
                  maxHeight={280} 
                  overflow="scrollY"
                  dangerouslySetInlineStyle={{
                    __style: { marginRight: '-8px', paddingRight: '8px' },
                  }}
                >
                  {/* Deselect Option */}
                  {selectedBoard && (
                    <TapArea onTap={handleDeselect} rounding={2}>
                      <Box paddingY={2} paddingX={3}>
                        <Flex alignItems="center" gap={3}>
                          <Box
                            width={40}
                            height={40}
                            rounding={2}
                            color="secondary"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Icon accessibilityLabel="" icon="cancel" size={16} color="subtle" />
                          </Box>
                          <Text size="200" color="subtle">
                            No board selected
                          </Text>
                        </Flex>
                      </Box>
                    </TapArea>
                  )}

                  {/* Boards */}
                  {filteredBoards.map((board) => (
                    <BoardPickerItem
                      key={board.id}
                      board={board}
                      isSelected={selectedBoard?.id === board.id}
                      onSelect={() => handleBoardSelect(board)}
                    />
                  ))}

                  {/* No results */}
                  {filteredBoards.length === 0 && !isBoardsLoading && (
                    <Box padding={4}>
                      <Text align="center" color="subtle" size="200">
                        {searchQuery ? `No boards matching "${searchQuery}"` : 'No boards yet'}
                      </Text>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Popover>
        </Layer>
      )}

      {/* Create Modal */}
      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default BoardPicker;