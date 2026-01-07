// src/modules/board/components/BoardSaveDropdown.tsx

import React, { useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Spinner,
  SearchField,
  Divider,
  TapArea,
  Icon,
  Layer,
  Popover,
} from 'gestalt';
import { BoardListItem } from './BoardListItem';
import type { BoardWithPinStatusResponse } from '../types/board.types';

type BoardSaveDropdownSize = 'sm' | 'md';

type Padding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface BoardSaveDropdownProps {
  isOpen: boolean;
  anchorElement: HTMLElement | null;
  onDismiss: () => void;

  // Data
  boards: BoardWithPinStatusResponse[];
  isLoading: boolean;
  savedBoardsCount: number;

  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch?: boolean;

  // Actions
  savingToBoardId: string | null;
  removingFromBoardId: string | null;
  onSaveToBoard: (board: BoardWithPinStatusResponse) => void;
  onRemoveFromBoard: (board: BoardWithPinStatusResponse) => void;
  onCreateNew: () => void;

  // Optional
  pinTitle?: string | null;
  size?: BoardSaveDropdownSize;
}

interface SizeConfig {
  width: number;
  maxHeight: number;
  minHeight: number;
  headerSize: '300' | '400';
  padding: Padding;
  listItemSize: 'sm' | 'md';
  marginBottom: 2 | 3;
  marginTop: 2 | 3;
  spinnerPadding: Padding;
  emptyPadding: Padding;
  iconSize: 14 | 20;
  createButtonPadding: Padding;
  createButtonRounding: 2 | 3;
  createTextSize: '200' | '300';
}

const sizeConfig: Record<BoardSaveDropdownSize, SizeConfig> = {
  sm: {
    width: 300,
    maxHeight: 240,
    minHeight: 200,
    headerSize: '300',
    padding: 3,
    listItemSize: 'sm',
    marginBottom: 2,
    marginTop: 2,
    spinnerPadding: 4,
    emptyPadding: 3,
    iconSize: 14,
    createButtonPadding: 2,
    createButtonRounding: 2,
    createTextSize: '200',
  },
  md: {
    width: 340,
    maxHeight: 320,
    minHeight: 280,
    headerSize: '400',
    padding: 4,
    listItemSize: 'md',
    marginBottom: 3,
    marginTop: 3,
    spinnerPadding: 6,
    emptyPadding: 4,
    iconSize: 20,
    createButtonPadding: 3,
    createButtonRounding: 3,
    createTextSize: '300',
  },
};

export const BoardSaveDropdown: React.FC<BoardSaveDropdownProps> = ({
  isOpen,
  anchorElement,
  onDismiss,
  boards,
  isLoading,
  savedBoardsCount,
  searchQuery,
  onSearchChange,
  showSearch = true,
  savingToBoardId,
  removingFromBoardId,
  onSaveToBoard,
  onRemoveFromBoard,
  onCreateNew,
  pinTitle,
  size = 'md',
}) => {
  const config = sizeConfig[size];
  const showSearchField = showSearch && boards.length > 5;

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter((b) => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  const headerText = useMemo(() => {
    return savedBoardsCount > 0
      ? `Saved to ${savedBoardsCount} ${savedBoardsCount === 1 ? 'board' : 'boards'}`
      : 'Save to board';
  }, [savedBoardsCount]);

  if (!isOpen || !anchorElement) return null;

  return (
    <Layer>
      <Popover
        anchor={anchorElement}
        onDismiss={onDismiss}
        idealDirection="down"
        forceDirection
        positionRelativeToAnchor={false}
        size="flexible"
        color="white"
        // ✅ Убраны несуществующие пропсы showCaret и shouldFocus
      >
        <Box
          padding={config.padding}
          width={config.width}
          minHeight={config.minHeight}
          dangerouslySetInlineStyle={{
            __style: {
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {/* Header - фиксированная высота */}
          <Box marginBottom={3} minHeight={44}>
            <Text weight="bold" size={config.headerSize} align="center">
              {headerText}
            </Text>
            {pinTitle && savedBoardsCount > 0 && (
              <Box marginTop={1}>
                <Text size="200" color="subtle" align="center" lineClamp={1}>
                  {pinTitle}
                </Text>
              </Box>
            )}
          </Box>

          {/* Search - фиксированная высота */}
          {showSearchField && (
            <Box marginBottom={config.marginBottom} minHeight={48}>
              <SearchField
                id="board-save-dropdown-search"
                accessibilityLabel="Search boards"
                accessibilityClearButtonLabel="Clear"
                placeholder="Search"
                value={searchQuery}
                onChange={({ value }) => onSearchChange(value)}
                size={size === 'sm' ? 'md' : 'lg'}
              />
            </Box>
          )}

          {/* Boards List - фиксированная высота контейнера */}
          <Box
            maxHeight={config.maxHeight}
            minHeight={config.minHeight - 160}
            overflow="scrollY"
            flex="grow"
            dangerouslySetInlineStyle={{
              __style: {
                overflowAnchor: 'none',
              },
            }}
          >
            {isLoading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
                minHeight={120}
              >
                <Spinner accessibilityLabel="Loading" show size={size === 'sm' ? 'sm' : 'md'} />
              </Box>
            ) : (
              <Flex direction="column" gap={1}>
                {filteredBoards.map((board) => (
                  <BoardListItem
                    key={board.id}
                    board={board}
                    onSave={() => onSaveToBoard(board)}
                    onRemove={() => onRemoveFromBoard(board)}
                    isSaving={savingToBoardId === board.id}
                    isRemoving={removingFromBoardId === board.id}
                    size={config.listItemSize}
                  />
                ))}

                {filteredBoards.length === 0 && (
                  <Box
                    padding={config.emptyPadding}
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    minHeight={80}
                  >
                    <Text align="center" color="subtle" size={size === 'sm' ? '100' : '200'}>
                      {searchQuery ? 'No boards found' : 'No boards yet'}
                    </Text>
                  </Box>
                )}
              </Flex>
            )}
          </Box>

          <Divider />

          {/* Create Board Button - фиксированная высота */}
          <Box marginTop={config.marginTop} minHeight={44}>
            <TapArea onTap={onCreateNew} rounding={config.createButtonRounding}>
              <Box
                padding={config.createButtonPadding}
                rounding={config.createButtonRounding}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="secondary"
              >
                <Flex alignItems="center" gap={2}>
                  <Icon accessibilityLabel="" icon="add" size={config.iconSize} />
                  <Text weight="bold" size={config.createTextSize}>
                    Create board
                  </Text>
                </Flex>
              </Box>
            </TapArea>
          </Box>
        </Box>
      </Popover>
    </Layer>
  );
};

export default BoardSaveDropdown;