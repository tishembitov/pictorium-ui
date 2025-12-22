// src/modules/board/components/BoardGrid.tsx

import React, { useState, useCallback } from 'react';
import { Box, Spinner, Text, TapArea, Icon, Heading } from 'gestalt';
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
  title?: string;
}

// Create board card with modern design
const CreateBoardCard: React.FC<{
  height: number;
  onClick: () => void;
}> = ({ height, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TapArea onTap={onClick} rounding={4}>
      <Box
        height={height}
        rounding={4}
        display="flex"
        direction="column"
        alignItems="center"
        justifyContent="center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            border: '2px dashed var(--border-default)',
            background: isHovered 
              ? 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)' 
              : 'var(--bg-secondary)',
            transition: 'all 0.2s ease',
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          },
        }}
      >
        <Box
          rounding="circle"
          padding={3}
          color={isHovered ? 'primary' : 'secondary'}
          marginBottom={2}
          dangerouslySetInlineStyle={{
            __style: {
              transition: 'all 0.2s ease',
            },
          }}
        >
          <Icon 
            accessibilityLabel="" 
            icon="add" 
            size={24} 
            color={isHovered ? 'inverse' : 'default'}
          />
        </Box>
        <Text weight="bold" size="200">
          Create board
        </Text>
      </Box>
    </TapArea>
  );
};

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
  title,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateClick = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback((boardId: string) => {
    setShowCreateModal(false);
    onCreateSuccess?.(boardId);
  }, [onCreateSuccess]);

  const cardHeight = cardSize === 'sm' ? 120 : cardSize === 'lg' ? 200 : 160;

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
      {/* Title */}
      {title && (
        <Box marginBottom={4}>
          <Heading size="400" accessibilityLevel={2}>
            {title}
          </Heading>
        </Box>
      )}

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
          <Box>
            <CreateBoardCard height={cardHeight} onClick={handleCreateClick} />
            <Box paddingY={2}>
              <Text weight="bold" size="300">
                New board
              </Text>
            </Box>
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
        <Box marginTop={6}>
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