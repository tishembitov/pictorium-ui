// src/modules/board/components/BoardSelector.tsx

import React, { useState } from 'react';
import { Box, Flex, Button, Text, Spinner } from 'gestalt';
import { BoardCard } from './BoardCard';
import { BoardCreateModal } from './BoardCreateModal';
import { useMyBoards } from '../hooks/useMyBoards';
import { useAddPinToBoard } from '../hooks/useAddPinToBoard';
import type { BoardResponse } from '../types/board.types';

interface BoardSelectorProps {
  pinId: string;
  onSelect?: (board: BoardResponse) => void;
  onClose?: () => void;
}

export const BoardSelector: React.FC<BoardSelectorProps> = ({
  pinId,
  onSelect,
  onClose,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { boards, isLoading, isEmpty } = useMyBoards();
  const { addPinToBoard } = useAddPinToBoard({
    onSuccess: onClose,
  });

  const handleBoardSelect = (board: BoardResponse) => {
    addPinToBoard({ boardId: board.id, pinId });
    onSelect?.(board);
  };

  const handleCreateSuccess = (boardId: string) => {
    addPinToBoard({ boardId, pinId });
    setShowCreateModal(false);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={6}>
        <Spinner accessibilityLabel="Loading boards" show />
      </Box>
    );
  }

  return (
    <Box>
      <Flex direction="column" gap={4}>
        {/* Create new board button */}
        <Button
          text="Create board"
          onClick={() => setShowCreateModal(true)}
          size="lg"
          color="gray"
          fullWidth
          iconEnd="add"
        />

        {/* Boards list */}
        {isEmpty ? (
          <Box padding={4}>
            <Text align="center" color="subtle">
              You don't have any boards yet
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap={2}>
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onClick={() => handleBoardSelect(board)}
                showMeta={false}
              />
            ))}
          </Flex>
        )}
      </Flex>

      {/* Create board modal */}
      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </Box>
  );
};

export default BoardSelector;