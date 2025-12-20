// src/modules/board/components/BoardGrid.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Box, Spinner, Text, IconButton, Tooltip } from 'gestalt';
import { BoardCard } from './BoardCard';
import { BoardCreateModal } from './BoardCreateModal';
import { EmptyState } from '@/shared/components';
import type { BoardResponse } from '../types/board.types';

interface BoardGridProps {
  boards: BoardResponse[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: {
    text: string;
    onClick: () => void;
  };
  onBoardClick?: (board: BoardResponse) => void;
  onBoardEdit?: (board: BoardResponse) => void;
  showCreateButton?: boolean;
  onCreateSuccess?: (boardId: string) => void;
  columns?: 2 | 3 | 4 | 5;
  cardSize?: 'sm' | 'md' | 'lg';
}

export const BoardGrid: React.FC<BoardGridProps> = ({
  boards,
  isLoading = false,
  emptyMessage = 'No boards yet',
  emptyDescription,
  emptyAction,
  onBoardClick,
  onBoardEdit,
  showCreateButton = false,
  onCreateSuccess,
  columns = 4,
  cardSize = 'md',
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateClick = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback((boardId: string) => {
    setShowCreateModal(false);
    onCreateSuccess?.(boardId);
  }, [onCreateSuccess]);

  // ✅ Вынесен в отдельную переменную
  const cardHeight = useMemo(() => {
    if (cardSize === 'sm') return 120;
    if (cardSize === 'lg') return 200;
    return 160;
  }, [cardSize]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={8}>
        <Spinner accessibilityLabel="Loading boards" show />
      </Box>
    );
  }

  if (boards.length === 0 && !showCreateButton) {
    return (
      <EmptyState
        title={emptyMessage}
        description={emptyDescription}
        icon="board"
        action={emptyAction}
      />
    );
  }

  // CSS Grid для responsive layout
  const gridTemplateColumns: Record<number, string> = {
    2: 'repeat(2, 1fr)',
    3: 'repeat(auto-fill, minmax(200px, 1fr))',
    4: 'repeat(auto-fill, minmax(236px, 1fr))',
    5: 'repeat(auto-fill, minmax(180px, 1fr))',
  };

  return (
    <>
      <Box
        dangerouslySetInlineStyle={{
          __style: {
            display: 'grid',
            gridTemplateColumns: gridTemplateColumns[columns],
            gap: '16px',
          },
        }}
      >
        {/* Create Board Card */}
        {showCreateButton && (
          <Box
            height={cardHeight}
            rounding={4}
            color="secondary"
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: {
                border: '2px dashed var(--color-gray-300)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              },
            }}
          >
            <Tooltip text="Create new board">
              <IconButton
                accessibilityLabel="Create board"
                icon="add"
                size="lg"
                bgColor="transparent"
                onClick={handleCreateClick}
              />
            </Tooltip>
          </Box>
        )}

        {/* Board Cards */}
        {boards.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            size={cardSize}
            onClick={onBoardClick ? () => onBoardClick(board) : undefined}
            onEdit={onBoardEdit ? () => onBoardEdit(board) : undefined}
          />
        ))}
      </Box>

      {/* Empty state with create option */}
      {boards.length === 0 && showCreateButton && (
        <Box marginTop={4}>
          <Text align="center" color="subtle">
            {emptyMessage}
          </Text>
        </Box>
      )}

      {/* Create Board Modal */}
      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default BoardGrid;