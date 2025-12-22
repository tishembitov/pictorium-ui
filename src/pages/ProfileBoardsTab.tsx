// src/pages/ProfileBoardsTab.tsx

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Flex, 
  Text, 
  Spinner,
  Heading,
  Icon,
} from 'gestalt';
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

const ProfileBoardsTab: React.FC<ProfileBoardsTabProps> = ({ 
  userId, 
  isOwner = false,
}) => {
  const navigate = useNavigate();
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
    void refetch();
    navigate(buildPath.board(boardId));
  }, [refetch, navigate]);

  const handleEditClose = useCallback(() => {
    setEditingBoard(null);
    void refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={12}>
        <Spinner accessibilityLabel="Loading boards" show />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box marginBottom={6}>
        <Flex alignItems="center" gap={3}>
          <Heading size="400" accessibilityLevel={2}>
            Boards
          </Heading>
          <Box 
            color="secondary" 
            rounding="pill" 
            paddingX={3} 
            paddingY={1}
          >
            <Text size="200" weight="bold">
              {boards.length}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Selected Board Indicator */}
      {isOwner && selectedBoard && (
        <Box 
          marginBottom={6} 
          padding={4} 
          rounding={4}
          dangerouslySetInlineStyle={{
            __style: {
              background: 'linear-gradient(135deg, #0a7c42 0%, #0d9f4f 100%)',
            },
          }}
        >
          <Flex alignItems="center" gap={3}>
            <Box 
              color="light" 
              rounding="circle" 
              padding={2}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon accessibilityLabel="" icon="check" size={16} color="success" />
            </Box>
            <Flex direction="column">
              <Text size="100" color="inverse">
                Currently saving new pins to
              </Text>
              <Text weight="bold" color="inverse" size="300">
                {selectedBoard.title}
              </Text>
            </Flex>
          </Flex>
        </Box>
      )}

      {/* Boards Grid - только grid, без переключателя */}
      <BoardGrid
        boards={boards}
        columns={4}
        cardSize="md"
        onBoardClick={handleBoardClick}
        onBoardEdit={isOwner ? handleBoardEdit : undefined}
        showCreateButton={isOwner}
        onCreateSuccess={handleCreateSuccess}
        emptyMessage={isOwner ? "You haven't created any boards yet" : "No boards yet"}
        emptyDescription={isOwner ? "Create boards to organize your saved pins" : undefined}
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