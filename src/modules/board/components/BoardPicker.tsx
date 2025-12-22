// src/modules/board/components/BoardPicker.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Box, 
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
  Button,
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
  showLabel?: boolean;
  allowDeselect?: boolean; // Контролирует возможность отмены выбора
}

// Compact board item for picker
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
        paddingX={2}
        rounding={2}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'all 0.15s ease',
            border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
            backgroundColor: isSelected ? 'rgba(230, 0, 35, 0.08)' : 'transparent',
          },
        }}
      >
        <Flex alignItems="center" gap={2}>
          {/* Mini Cover */}
          <Box
            width={36}
            height={36}
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
            <Icon accessibilityLabel="Selected" icon="check" size={14} color="success" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

export const BoardPicker: React.FC<BoardPickerProps> = ({
  onBoardChange,
  size = 'md',
  showLabel = false,
  allowDeselect = true, // По умолчанию можно отменить выбор
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);

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
    // Если кликнули на уже выбранную доску и разрешена отмена выбора
    if (selectedBoard?.id === board.id && allowDeselect) {
      deselectBoard();
      onBoardChange?.(null);
    } else {
      selectBoard(board.id);
      onBoardChange?.(board);
    }
    setIsOpen(false);
  }, [selectedBoard, allowDeselect, selectBoard, deselectBoard, onBoardChange]);

  const handleCreateNew = useCallback(() => {
    setIsOpen(false);
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback((boardId: string) => {
    selectBoard(boardId);
    setShowCreateModal(false);
  }, [selectBoard]);

  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchorElement(node);
  }, []);

  // Размеры в зависимости от size
  const paddingX = size === 'sm' ? 2 : 3;
  const paddingY = size === 'sm' ? 1 : 2;
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <>
      <Tooltip text={selectedBoard ? `Saving to: ${selectedBoard.title}` : 'Select default board'}>
        <Box ref={setAnchorRef}>
          <TapArea onTap={handleToggle} rounding="pill">
            <Box
              paddingX={paddingX}
              paddingY={paddingY}
              rounding="pill"
              color={selectedBoard ? 'primary' : 'secondary'}
              display="flex"
              alignItems="center"
            >
              <Flex alignItems="center" gap={1}>
                <Icon 
                  accessibilityLabel="" 
                  icon="board" 
                  size={iconSize} 
                  color={selectedBoard ? 'inverse' : 'default'} 
                />
                {(showLabel || selectedBoard) && (
                  <Text 
                    size="200"
                    weight="bold" 
                    color={selectedBoard ? 'inverse' : 'default'}
                    lineClamp={1}
                  >
                    {selectedBoard?.title || 'Board'}
                  </Text>
                )}
                <Icon 
                  accessibilityLabel="" 
                  icon="arrow-down" 
                  size={10} 
                  color={selectedBoard ? 'inverse' : 'default'} 
                />
              </Flex>
            </Box>
          </TapArea>
        </Box>
      </Tooltip>

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
            <Box padding={3} width={260}>
              {/* Header */}
              <Box marginBottom={2}>
                <Text weight="bold" size="300">
                  Default save board
                </Text>
                <Text color="subtle" size="100">
                  New pins will be saved here
                </Text>
              </Box>

              {/* Search - только если много досок */}
              {boards.length > 4 && (
                <Box marginBottom={2}>
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

              {/* Create New Button */}
              <Box marginBottom={2}>
                <Button
                  text="Create board"
                  onClick={handleCreateNew}
                  size="md"
                  color="gray"
                  fullWidth
                  iconEnd="add"
                />
              </Box>

              <Divider />

              {/* Board List - БЕЗ опции None */}
              <Box marginTop={2}>
                {isBoardsLoading ? (
                  <Box display="flex" justifyContent="center" padding={3}>
                    <Spinner accessibilityLabel="Loading boards" show size="sm" />
                  </Box>
                ) : (
                  <Box maxHeight={200} overflow="scrollY">
                    <Flex direction="column" gap={1}>
                      {/* Boards - без опции None */}
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

              {/* Hint about deselection */}
              {selectedBoard && allowDeselect && (
                <Box marginTop={2} paddingTop={2}>
                  <Text align="center" color="subtle" size="100">
                    Tap selected board to deselect
                  </Text>
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