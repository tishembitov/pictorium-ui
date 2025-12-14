// ================================================
// FILE: src/pages/ProfileBoardsTab.tsx
// ================================================
import React, { useState } from 'react';
import { Box, Button, Flex, Text } from 'gestalt';
import { 
  BoardGrid, 
  BoardCreateModal, 
  useUserBoards,
  useSelectedBoard,
  useSelectBoard,
} from '@/modules/board';
import type { BoardResponse } from '@/modules/board';

interface ProfileBoardsTabProps {
  userId: string;
  isOwner?: boolean;
}

const ProfileBoardsTab: React.FC<ProfileBoardsTabProps> = ({ userId, isOwner = false }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Убрана неиспользуемая переменная isEmpty
  const { boards, isLoading, refetch } = useUserBoards(userId);
  const { selectedBoard } = useSelectedBoard();
  const { selectBoard } = useSelectBoard();

  const handleCreateSuccess = (boardId: string) => {
    setShowCreateModal(false);
    refetch();
    selectBoard(boardId);
  };

  const handleBoardClick = (board: BoardResponse) => {
    if (isOwner) {
      selectBoard(board.id);
    }
  };

  return (
    <Box>
      {/* Header - marginBottom вынесен в Box-обёртку */}
      <Box marginBottom={4}>
        <Flex justifyContent="between" alignItems="center" wrap>
          <Text size="300" weight="bold">
            {boards.length} {boards.length === 1 ? 'Board' : 'Boards'}
          </Text>
          
          {isOwner && (
            <Button
              text="Create board"
              onClick={() => setShowCreateModal(true)}
              color="red"
              size="md"
            />
          )}
        </Flex>
      </Box>

      {/* Selected Board Indicator */}
      {isOwner && selectedBoard && (
        <Box marginBottom={4} padding={3} color="secondary" rounding={2}>
          <Flex alignItems="center" gap={2}>
            <Text size="200" color="subtle">Currently saving to:</Text>
            <Text size="200" weight="bold">{selectedBoard.title}</Text>
          </Flex>
        </Box>
      )}

      {/* Boards Grid */}
      <BoardGrid
        boards={boards}
        isLoading={isLoading}
        emptyMessage={isOwner ? "You haven't created any boards yet" : "No boards yet"}
        emptyAction={
          isOwner
            ? {
                text: 'Create your first board',
                onClick: () => setShowCreateModal(true),
              }
            : undefined
        }
        onBoardClick={handleBoardClick}
      />

      {/* Create Board Modal */}
      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </Box>
  );
};

export default ProfileBoardsTab;