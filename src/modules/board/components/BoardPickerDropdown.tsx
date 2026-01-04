// src/modules/board/components/BoardPickerDropdown.tsx

import React from 'react';
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
import { BoardPickerItem } from './BoardPickerItem';
import type { BoardResponse } from '../types/board.types';

type BoardPickerDropdownSize = 'sm' | 'md';

type Padding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface BoardPickerDropdownProps {
  isOpen: boolean;
  anchorElement: HTMLElement | null;
  onDismiss: () => void;

  // Data
  boards: BoardResponse[];
  isLoading: boolean;
  selectedBoardId: string | null;

  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch?: boolean;

  // Actions
  onSelectBoard: (board: BoardResponse) => void;
  onCreateNew: () => void;

  // Optional
  title?: string;
  size?: BoardPickerDropdownSize;
  getBoardPinCount?: (boardId: string) => number | undefined;
}

interface SizeConfig {
  width: number;
  maxHeight: number;
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

const sizeConfig: Record<BoardPickerDropdownSize, SizeConfig> = {
  sm: {
    width: 300,
    maxHeight: 240,
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

export const BoardPickerDropdown: React.FC<BoardPickerDropdownProps> = ({
  isOpen,
  anchorElement,
  onDismiss,
  boards,
  isLoading,
  selectedBoardId,
  searchQuery,
  onSearchChange,
  showSearch = true,
  onSelectBoard,
  onCreateNew,
  title = 'Select a board',
  size = 'md',
  getBoardPinCount,
}) => {
  if (!isOpen || !anchorElement) return null;

  const config = sizeConfig[size];
  const showSearchField = showSearch && boards.length > 5;

  const filteredBoards = searchQuery.trim()
    ? boards.filter((b) => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : boards;

  return (
    <Layer>
      <Popover
        anchor={anchorElement}
        onDismiss={onDismiss}
        idealDirection="down"
        forceDirection
        positionRelativeToAnchor
        size="flexible"
        color="white"
      >
        <Box padding={config.padding} width={config.width}>
          {/* Header */}
          <Box marginBottom={3}>
            <Text weight="bold" size={config.headerSize} align="center">
              {title}
            </Text>
          </Box>

          {/* Search */}
          {showSearchField && (
            <Box marginBottom={config.marginBottom}>
              <SearchField
                id="board-picker-dropdown-search"
                accessibilityLabel="Search boards"
                accessibilityClearButtonLabel="Clear"
                placeholder="Search"
                value={searchQuery}
                onChange={({ value }) => onSearchChange(value)}
                size={size === 'sm' ? 'md' : 'lg'}
              />
            </Box>
          )}

          {/* Boards List */}
          <Box maxHeight={config.maxHeight} overflow="scrollY">
            {isLoading ? (
              <Box display="flex" justifyContent="center" padding={config.spinnerPadding}>
                <Spinner accessibilityLabel="Loading" show size={size === 'sm' ? 'sm' : 'md'} />
              </Box>
            ) : (
              <Flex direction="column" gap={1}>
                {filteredBoards.map((board) => (
                  <BoardPickerItem
                    key={board.id}
                    board={board}
                    isSelected={selectedBoardId === board.id}
                    onSelect={() => onSelectBoard(board)}
                    pinCount={getBoardPinCount?.(board.id)}
                    size={config.listItemSize}
                  />
                ))}

                {filteredBoards.length === 0 && (
                  <Box padding={config.emptyPadding}>
                    <Text align="center" color="subtle" size={size === 'sm' ? '100' : '200'}>
                      {searchQuery ? 'No boards found' : 'No boards yet'}
                    </Text>
                  </Box>
                )}
              </Flex>
            )}
          </Box>

          <Divider />

          {/* Create Board Button */}
          <Box marginTop={config.marginTop}>
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

export default BoardPickerDropdown;