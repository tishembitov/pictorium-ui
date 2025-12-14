// src/modules/board/components/BoardHeader.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, IconButton, Tooltip } from 'gestalt';
import { useIsOwner } from '@/modules/auth';
import { useDeleteBoard } from '../hooks/useDeleteBoard';
import { useConfirmModal } from '@/shared/hooks/useConfirmModal';
import { formatRelativeTime, formatCompactNumber } from '@/shared/utils/formatters';
import type { BoardResponse } from '../types/board.types';

interface BoardHeaderProps {
  board: BoardResponse;
  pinCount?: number;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  pinCount = 0,
}) => {
  const navigate = useNavigate();
  const isOwner = useIsOwner(board.userId);
  const { confirm } = useConfirmModal();
  const { deleteBoard, isLoading: isDeleting } = useDeleteBoard();

  const handleBack = () => {
    navigate(-1);
  };

  const handleDelete = () => {
    confirm({
      title: 'Delete Board?',
      message: 'This will permanently delete this board. Pins will not be deleted.',
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => deleteBoard(board.id),
    });
  };

  return (
    <Box paddingY={4}>
      <Flex direction="column" gap={4}>
        {/* Navigation */}
        <Flex alignItems="center" justifyContent="between">
          <Tooltip text="Go back">
            <IconButton
              accessibilityLabel="Go back"
              icon="arrow-back"
              onClick={handleBack}
              size="lg"
              bgColor="transparent"
            />
          </Tooltip>

          {isOwner && (
            <Flex gap={2}>
              <Tooltip text="Delete board">
                <IconButton
                  accessibilityLabel="Delete board"
                  icon="trash-can"
                  onClick={handleDelete}
                  size="lg"
                  bgColor="transparent"
                  disabled={isDeleting}
                />
              </Tooltip>
            </Flex>
          )}
        </Flex>

        {/* Board Info */}
        <Box>
          <Heading size="400" align="center">
            {board.title}
          </Heading>
          <Box marginTop={2}>
            <Text align="center" color="subtle">
              {formatCompactNumber(pinCount)} {pinCount === 1 ? 'pin' : 'pins'} ·
              Updated {formatRelativeTime(board.updatedAt)}
            </Text>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default BoardHeader;