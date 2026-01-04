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
} from 'gestalt';
import { BoardPickerItem } from './BoardPickerItem';
import type { BoardResponse } from '../types/board.types';

interface BoardPickerDropdownProps {
  isOpen: boolean;
  onDismiss: () => void;
  
  // Data
  boards: BoardResponse[];
  isLoading: boolean;
  selectedBoardId: string | null;
  
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  
  // Actions
  onSelectBoard: (board: BoardResponse) => void;
  onCreateNew: () => void;
  
  // Optional
  getBoardPinCount?: (boardId: string) => number | undefined;
}

export const BoardPickerDropdown: React.FC<BoardPickerDropdownProps> = ({
  isOpen,
  onDismiss,
  boards,
  isLoading,
  selectedBoardId,
  searchQuery,
  onSearchChange,
  onSelectBoard,
  onCreateNew,
  getBoardPinCount,
}) => {
  if (!isOpen) return null;

  const showSearchField = boards.length > 5;

  const filteredBoards = searchQuery.trim()
    ? boards.filter((b) => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : boards;

  return (
    <Box marginTop={2}>
      <Box
        rounding={4}
        overflow="hidden"
        dangerouslySetInlineStyle={{
          __style: {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.1)',
          },
        }}
      >
        <Box padding={3} color="default">
          {/* Header */}
          <Box marginBottom={3}>
            <Flex justifyContent="between" alignItems="center">
              <Text weight="bold" size="300">
                Select a board
              </Text>
              <TapArea onTap={onDismiss} rounding="circle">
                <Icon accessibilityLabel="Close" icon="cancel" size={20} />
              </TapArea>
            </Flex>
          </Box>

          {/* Search */}
          {showSearchField && (
            <Box marginBottom={3}>
              <SearchField
                id="board-picker-search"
                accessibilityLabel="Search boards"
                accessibilityClearButtonLabel="Clear"
                placeholder="Search"
                value={searchQuery}
                onChange={({ value }) => onSearchChange(value)}
                size="lg"
              />
            </Box>
          )}

          {/* Boards List */}
          <Box maxHeight={280} overflow="scrollY">
            {isLoading ? (
              <Box display="flex" justifyContent="center" padding={6}>
                <Spinner accessibilityLabel="Loading" show size="md" />
              </Box>
            ) : filteredBoards.length === 0 ? (
              <Box padding={4}>
                <Text align="center" color="subtle" size="200">
                  {searchQuery ? 'No boards found' : 'No boards yet. Create your first board!'}
                </Text>
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
                  />
                ))}
              </Flex>
            )}
          </Box>

          <Divider />

          {/* Create Board Button */}
          <Box marginTop={3}>
            <TapArea onTap={onCreateNew} rounding={3}>
              <Box
                padding={3}
                rounding={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="secondary"
              >
                <Flex alignItems="center" gap={2}>
                  <Icon accessibilityLabel="" icon="add" size={20} />
                  <Text weight="bold" size="300">
                    Create board
                  </Text>
                </Flex>
              </Box>
            </TapArea>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default BoardPickerDropdown;