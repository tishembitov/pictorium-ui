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
  Heading,
} from 'gestalt';
import { BoardCreateModal } from './BoardCreateModal';
import { useMyBoards } from '../hooks/useMyBoards';
import { useSavePinToBoard } from '../hooks/useSavePinToBoard';
import { useSelectedBoard } from '../hooks/useSelectedBoard';
import { useImageUrl } from '@/modules/storage';
import { useBoardPins } from '../hooks/useBoardPins';
import type { BoardResponse } from '../types/board.types';

interface BoardSelectorProps {
  pinId: string;
  onSelect?: (board: BoardResponse) => void;
  onClose?: () => void;
}

// Board item with preview - исправленные цвета
const BoardSelectorItem: React.FC<{
  board: BoardResponse;
  isSelected: boolean;
  onSelect: () => void;
  isSaving: boolean;
}> = ({ board, isSelected, onSelect, isSaving }) => {
  const { pins, totalElements: pinCount } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  return (
    <TapArea onTap={onSelect} rounding={3} disabled={isSaving}>
      <Box
        padding={3}
        rounding={3}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'all 0.2s ease',
            // ✅ Исправлено: светлый фон для выделенной доски
            backgroundColor: isSelected ? 'rgba(230, 0, 35, 0.08)' : 'transparent',
            border: isSelected ? '2px solid #e60023' : '2px solid transparent',
            opacity: isSaving ? 0.6 : 1,
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Board Cover */}
          <Box
            width={56}
            height={56}
            rounding={3}
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
              <Icon accessibilityLabel="" icon="board" size={24} color="subtle" />
            )}
          </Box>

          {/* Board Info */}
          <Flex direction="column" flex="grow" gap={1}>
            <Text weight="bold" size="200" lineClamp={1}>
              {board.title}
            </Text>
            <Flex alignItems="center" gap={2}>
              <Text color="subtle" size="100">
                {pinCount} {pinCount === 1 ? 'pin' : 'pins'}
              </Text>
              {isSelected && (
                <>
                  <Text color="subtle" size="100">•</Text>
                  <Text color="success" size="100" weight="bold">
                    Default
                  </Text>
                </>
              )}
            </Flex>
          </Flex>

          {/* Save Button */}
          <Button
            text={isSaving ? '...' : 'Save'}
            size="sm"
            color="red"
            disabled={isSaving}
          />
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
  const [savingToBoardId, setSavingToBoardId] = useState<string | null>(null);

  const { boards, isLoading, isEmpty } = useMyBoards();
  const { selectedBoard } = useSelectedBoard();
  const { savePinToBoard } = useSavePinToBoard({
    onSuccess: () => {
      setSavingToBoardId(null);
      onClose?.();
    },
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
    setSavingToBoardId(board.id);
    savePinToBoard({ boardId: board.id, pinId });
    onSelect?.(board);
  }, [savePinToBoard, pinId, onSelect]);

  const handleCreateSuccess = useCallback((boardId: string) => {
    setSavingToBoardId(boardId);
    savePinToBoard({ boardId, pinId });
    setShowCreateModal(false);
  }, [savePinToBoard, pinId]);

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
        {/* Header */}
        <Heading size="400" accessibilityLevel={2}>
          Save to board
        </Heading>

        {/* Search Field */}
        {boards.length > 4 && (
          <SearchField
            id="board-selector-search"
            accessibilityLabel="Search boards"
            accessibilityClearButtonLabel="Clear search"
            placeholder="Search your boards..."
            value={searchQuery}
            onChange={({ value }) => setSearchQuery(value)}
          />
        )}

        {/* Create Board Button */}
        <Button
          text="Create new board"
          onClick={() => setShowCreateModal(true)}
          size="lg"
          color="gray"
          fullWidth
          iconEnd="add"
        />

        {/* Boards List */}
        {isEmpty ? (
          <Box padding={6} color="secondary" rounding={4}>
            <Flex direction="column" alignItems="center" gap={3}>
              <Icon accessibilityLabel="" icon="board" size={48} color="subtle" />
              <Text align="center" color="subtle">
                You don't have any boards yet.
              </Text>
            </Flex>
          </Box>
        ) : (
          <Box 
            maxHeight={300} 
            overflow="scrollY"
          >
            <Flex direction="column" gap={1}>
              {filteredBoards.map((board) => (
                <BoardSelectorItem
                  key={board.id}
                  board={board}
                  isSelected={selectedBoard?.id === board.id}
                  onSelect={() => handleBoardSelect(board)}
                  isSaving={savingToBoardId === board.id}
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