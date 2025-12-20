// src/pages/ProfileBoardsTab.tsx

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, SegmentedControl, Spinner } from 'gestalt';
import { 
  BoardGrid, 
  BoardEditModal,
  useUserBoards,
  useSelectedBoard,
} from '@/modules/board';
import { buildPath } from '@/app/router/routeConfig';
import type { BoardResponse } from '@/modules/board';

interface ProfileBoardsTabProps {
  userId: string;
  isOwner?: boolean;
}

type ViewMode = 'grid' | 'list';

const ProfileBoardsTab: React.FC<ProfileBoardsTabProps> = ({ 
  userId, 
  isOwner = false,
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editingBoard, setEditingBoard] = useState<BoardResponse | null>(null);
  
  const { boards, isLoading, refetch } = useUserBoards(userId);
  const { selectedBoard } = useSelectedBoard();

  const handleBoardClick = useCallback((board: BoardResponse) => {
    navigate(buildPath.board(board.id));
  }, [navigate]);

  const handleBoardEdit = useCallback((board: BoardResponse) => {
    setEditingBoard(board);
  }, []);

  const handleCreateSuccess = useCallback((boardId: string) => {
    refetch();
    navigate(buildPath.board(boardId));
  }, [refetch, navigate]);

  const handleEditClose = useCallback(() => {
    setEditingBoard(null);
    refetch();
  }, [refetch]);

  const handleViewChange = useCallback(({ activeIndex }: { activeIndex: number }) => {
    setViewMode(activeIndex === 0 ? 'grid' : 'list');
  }, []);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={8}>
        <Spinner accessibilityLabel="Loading boards" show />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header - обёрнут в Box для marginBottom */}
      <Box marginBottom={4}>
        <Flex justifyContent="between" alignItems="center">
          <Flex alignItems="center" gap={2}>
            <Text size="400" weight="bold">
              {boards.length}
            </Text>
            <Text size="400" color="subtle">
              {boards.length === 1 ? 'board' : 'boards'}
            </Text>
          </Flex>

          {/* View Toggle */}
          <SegmentedControl
            items={['Grid', 'List']}
            selectedItemIndex={viewMode === 'grid' ? 0 : 1}
            onChange={handleViewChange}
          />
        </Flex>
      </Box>

      {/* Selected Board Indicator */}
      {isOwner && selectedBoard && (
        <Box 
          marginBottom={4} 
          padding={3} 
          color="infoBase" 
          rounding={3}
        >
          <Flex alignItems="center" gap={2}>
            <Text size="200" color="inverse">
              📌 Currently saving to:
            </Text>
            <Text size="200" weight="bold" color="inverse">
              {selectedBoard.title}
            </Text>
          </Flex>
        </Box>
      )}

      {/* Boards Grid */}
      <BoardGrid
        boards={boards}
        columns={viewMode === 'grid' ? 4 : 2}
        cardSize={viewMode === 'grid' ? 'md' : 'lg'}
        onBoardClick={handleBoardClick}
        onBoardEdit={isOwner ? handleBoardEdit : undefined}
        showCreateButton={isOwner}
        onCreateSuccess={handleCreateSuccess}
        emptyMessage={isOwner ? "You haven't created any boards yet" : "No boards yet"}
        emptyDescription={isOwner ? "Organize your pins with boards" : undefined}
      />

      {/* Edit Modal */}
      {editingBoard && (
        <BoardEditModal
          board={editingBoard}
          isOpen={!!editingBoard}
          onClose={handleEditClose}
        />
      )}
    </Box>
  );
};

export default ProfileBoardsTab;