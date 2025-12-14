// src/modules/board/components/BoardGrid.tsx

import React from 'react';
import { Box, Flex, Spinner } from 'gestalt';
import { BoardCard } from './BoardCard';
import { EmptyState } from '@/shared/components';
import type { BoardResponse } from '../types/board.types';

interface BoardGridProps {
  boards: BoardResponse[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    text: string;
    onClick: () => void;
  };
  onBoardClick?: (board: BoardResponse) => void;
}

export const BoardGrid: React.FC<BoardGridProps> = ({
  boards,
  isLoading = false,
  emptyMessage = 'No boards yet',
  emptyAction,
  onBoardClick,
}) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={8}>
        <Spinner accessibilityLabel="Loading boards" show />
      </Box>
    );
  }

  if (boards.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        icon="board"
        action={emptyAction}
      />
    );
  }

  return (
    <Flex wrap gap={4}>
      {boards.map((board) => (
        <Box key={board.id} width={236}>
          <BoardCard
            board={board}
            onClick={onBoardClick ? () => onBoardClick(board) : undefined}
          />
        </Box>
      ))}
    </Flex>
  );
};

export default BoardGrid;