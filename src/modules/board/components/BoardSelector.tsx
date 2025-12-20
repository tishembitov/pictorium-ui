// src/modules/board/components/BoardSelector.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Box, 
  Flex, 
  Button, 
  Text, 
  Spinner, 
  SearchField,
  TapArea,
  Icon,
} from 'gestalt';
import { BoardCreateModal } from './BoardCreateModal';
import { useMyBoards } from '../hooks/useMyBoards';
import { useAddPinToBoard } from '../hooks/useAddPinToBoard';
import { useSelectedBoard } from '../hooks/useSelectedBoard';
import { useImageUrl } from '@/modules/storage';
import { useBoardPins } from '../hooks/useBoardPins';
import type { BoardResponse } from '../types/board.types';

interface BoardSelectorProps {
  pinId: string;
  onSelect?: (board: BoardResponse) => void;
  onClose?: () => void;
}

// Mini board preview item
const BoardSelectorItem: React.FC<{
  board: BoardResponse;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ board, isSelected, onSelect }) => {
  const { pins, totalElements: pinCount } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  return (
    <TapArea onTap={onSelect} rounding={3}>
      <Box
        padding={2}
        rounding={3}
        color={isSelected ? 'secondary' : 'transparent'}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'background-color 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Board Cover */}
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

          {/* Board Info */}
          <Flex direction="column" flex="grow">
            <Text weight="bold" size="200" lineClamp={1}>
              {board.title}
            </Text>
            <Text color="subtle" size="100">
              {pinCount} {pinCount === 1 ? 'pin' : 'pins'}
            </Text>
          </Flex>

          {/* Selected Indicator */}
          {isSelected && (
            <Icon accessibilityLabel="Selected" icon="check" size={20} color="default" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

export const BoardSelector: React.FC<BoardSelectorProps> = ({
  pinId,
  onSelect,
  onClose,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { boards, isLoading, isEmpty } = useMyBoards();
  const { selectedBoard } = useSelectedBoard();
  const { addPinToBoard, isLoading: isSaving } = useAddPinToBoard({
    onSuccess: onClose,
  });

  // Filter boards by search
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(board => 
      board.title.toLowerCase().includes(query)
    );
  }, [boards, searchQuery]);

  const handleBoardSelect = useCallback((board: BoardResponse) => {
    addPinToBoard({ boardId: board.id, pinId });
    onSelect?.(board);
  }, [addPinToBoard, pinId, onSelect]);

  const handleCreateSuccess = useCallback((boardId: string) => {
    addPinToBoard({ boardId, pinId });
    setShowCreateModal(false);
  }, [addPinToBoard, pinId]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={6}>
        <Spinner accessibilityLabel="Loading boards" show />
      </Box>
    );
  }

  return (
    <Box>
      <Flex direction="column" gap={3}>
        {/* Search Field */}
        {boards.length > 5 && (
          <SearchField
            id="board-selector-search"
            accessibilityLabel="Search boards"
            accessibilityClearButtonLabel="Clear search"
            placeholder="Search boards..."
            value={searchQuery}
            onChange={({ value }) => setSearchQuery(value)}
          />
        )}

        {/* Create Board Button */}
        <Button
          text="Create board"
          onClick={() => setShowCreateModal(true)}
          size="lg"
          color="gray"
          fullWidth
          iconEnd="add"
        />

        {/* Boards List */}
        {isEmpty ? (
          <Box padding={4}>
            <Text align="center" color="subtle">
              You don't have any boards yet
            </Text>
          </Box>
        ) : (
          <Box 
            maxHeight={300} 
            overflow="scrollY"
            dangerouslySetInlineStyle={{
              __style: { marginRight: '-8px', paddingRight: '8px' },
            }}
          >
            <Flex direction="column" gap={1}>
              {filteredBoards.map((board) => (
                <BoardSelectorItem
                  key={board.id}
                  board={board}
                  isSelected={selectedBoard?.id === board.id}
                  onSelect={() => handleBoardSelect(board)}
                />
              ))}
            </Flex>

            {filteredBoards.length === 0 && searchQuery && (
              <Box padding={4}>
                <Text align="center" color="subtle" size="200">
                  No boards matching "{searchQuery}"
                </Text>
              </Box>
            )}
          </Box>
        )}

        {/* Saving indicator */}
        {isSaving && (
          <Flex justifyContent="center" alignItems="center" gap={2}>
            <Spinner accessibilityLabel="Saving" show size="sm" />
            <Text size="200" color="subtle">Saving...</Text>
          </Flex>
        )}
      </Flex>

      {/* Create Board Modal */}
      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </Box>
  );
};

export default BoardSelector;