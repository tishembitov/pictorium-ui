// src/modules/board/components/BoardHeader.tsx

import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  IconButton, 
  Tooltip,
  Button,
  Dropdown,
  Icon,
} from 'gestalt';
import { ShareButton } from '@/shared/components';
import { useDeleteBoard } from '../hooks/useDeleteBoard';
import { useSelectBoard } from '../hooks/useSelectBoard';
import { useSelectedBoard } from '../hooks/useSelectedBoard';
import { useIsOwner } from '@/modules/auth';
import { useConfirmModal } from '@/shared/hooks/useConfirmModal';
import { formatCompactNumber } from '@/shared/utils/formatters';
import type { BoardResponse } from '../types/board.types';

interface BoardHeaderProps {
  board: BoardResponse;
  pinCount?: number;
  onEdit?: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  pinCount = 0,
  onEdit,
}) => {
  const { confirm } = useConfirmModal();
  const [showMenu, setShowMenu] = useState(false);
  const [menuAnchor] = useState<HTMLElement | null>(null);

  const { selectedBoard } = useSelectedBoard();
  const { selectBoard, deselectBoard, isLoading: isSelecting } = useSelectBoard();
  const { deleteBoard } = useDeleteBoard();
  
  const isOwner = useIsOwner(board.userId);
  const isSelected = selectedBoard?.id === board.id;
  const shareUrl = `${globalThis.location.origin}/board/${board.id}`;

  const handleSelectBoard = useCallback(() => {
    if (isSelected) {
      deselectBoard();
    } else {
      selectBoard(board.id);
    }
  }, [isSelected, deselectBoard, selectBoard, board.id]);

  const handleDelete = useCallback(() => {
    setShowMenu(false);
    confirm({
      title: 'Delete this board?',
      message: `Are you sure you want to delete "${board.title}"? This cannot be undone.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => deleteBoard(board.id),
    });
  }, [confirm, board.title, board.id, deleteBoard]);

  return (
    <Box paddingY={6}>
      <Flex direction="column" alignItems="center" gap={4}>
        {/* Selected Badge - только для своих досок */}
        {isOwner && isSelected && (
          <Box 
            color="successBase" 
            paddingX={3} 
            paddingY={2} 
            rounding="pill"
          >
            <Flex alignItems="center" gap={2}>
              <Icon accessibilityLabel="" icon="check" size={16} color="inverse" />
              <Text color="inverse" weight="bold" size="200">
                Default board
              </Text>
            </Flex>
          </Box>
        )}

        {/* Board Title */}
        <Heading size="400" align="center" accessibilityLevel={1}>
          {board.title}
        </Heading>

        {/* Pin Count */}
        <Text color="subtle" size="300">
          {formatCompactNumber(pinCount)} {pinCount === 1 ? 'Pin' : 'Pins'}
        </Text>

        {/* Actions */}
        <Flex gap={3} alignItems="center">
          {/* Set as default - только для своих досок */}
          {isOwner && (
            <Button
              text={isSelected ? 'Deselect' : 'Set as default'}
              onClick={handleSelectBoard}
              size="lg"
              color={isSelected ? 'gray' : 'red'}
              disabled={isSelecting}
            />
          )}

          {/* Edit - только для своих досок */}
          {isOwner && onEdit && (
            <Tooltip text="Edit board">
              <IconButton
                accessibilityLabel="Edit board"
                icon="edit"
                onClick={onEdit}
                size="lg"
                bgColor="lightGray"
              />
            </Tooltip>
          )}

          {/* Share Button */}
          <ShareButton
            url={shareUrl}
            title={board.title}
            size="lg"
            tooltipText="Share board"
          />

          {/* More options - только для владельца */}
          {isOwner && (
            <Box>
              {showMenu && menuAnchor && (
                <Dropdown
                  anchor={menuAnchor}
                  id="board-header-menu"
                  onDismiss={() => setShowMenu(false)}
                >
                  <Dropdown.Item
                    onSelect={() => { setShowMenu(false); onEdit?.(); }}
                    option={{ value: 'edit', label: 'Edit board' }}
                  />
                  <Dropdown.Item
                    onSelect={handleDelete}
                    option={{ value: 'delete', label: 'Delete board' }}
                    badge={{ text: 'Danger' }}
                  />
                </Dropdown>
              )}
            </Box>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default BoardHeader;