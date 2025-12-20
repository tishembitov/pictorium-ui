// src/modules/board/components/BoardHeader.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  IconButton, 
  Tooltip,
  Button,
  Dropdown,
} from 'gestalt';
import { useDeleteBoard } from '../hooks/useDeleteBoard';
import { useSelectBoard } from '../hooks/useSelectBoard';
import { useSelectedBoard } from '../hooks/useSelectedBoard';
import { useConfirmModal } from '@/shared/hooks/useConfirmModal';
import { useToast } from '@/shared/hooks/useToast';
import { formatCompactNumber } from '@/shared/utils/formatters';
import type { BoardResponse } from '../types/board.types';

interface BoardHeaderProps {
  board: BoardResponse;
  pinCount?: number;
  onBack?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  pinCount = 0,
  onBack,
  onEdit,
  onShare,
}) => {
  const navigate = useNavigate();
  const { confirm } = useConfirmModal();
  const { toast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const { selectedBoard } = useSelectedBoard();
  const { selectBoard, deselectBoard, isLoading: isSelecting } = useSelectBoard();
  const { deleteBoard } = useDeleteBoard();

  const isSelected = selectedBoard?.id === board.id;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleSelectBoard = () => {
    if (isSelected) {
      deselectBoard();
      toast.success('Board deselected');
    } else {
      selectBoard(board.id);
      toast.success(`Saving new pins to "${board.title}"`);
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    confirm({
      title: 'Delete this board?',
      message: `Are you sure you want to delete "${board.title}"? This cannot be undone. Pins in this board won't be deleted.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: () => deleteBoard(board.id),
    });
  };

  const handleShare = () => {
    setShowMenu(false);
    onShare?.();
  };

  return (
    <Box paddingY={6} position="relative">
      {/* Back Button */}
      <Box 
        position="absolute" 
        dangerouslySetInlineStyle={{ __style: { left: 0, top: 24 } }}
      >
        <Tooltip text="Go back">
          <IconButton
            accessibilityLabel="Go back"
            icon="arrow-back"
            onClick={handleBack}
            size="lg"
            bgColor="transparent"
          />
        </Tooltip>
      </Box>

      <Flex direction="column" alignItems="center" gap={4}>
        {/* Board Title */}
        <Heading size="600" align="center" accessibilityLevel={1}>
          {board.title}
        </Heading>

        {/* Pin Count */}
        <Text color="subtle" size="300">
          {formatCompactNumber(pinCount)} {pinCount === 1 ? 'Pin' : 'Pins'}
        </Text>

        {/* Actions */}
        <Flex gap={3} alignItems="center">
          {/* Select/Deselect Board */}
          <Button
            text={isSelected ? 'Selected' : 'Select'}
            onClick={handleSelectBoard}
            size="lg"
            color={isSelected ? 'red' : 'gray'}
            disabled={isSelecting}
          />

          {/* Edit Button */}
          {onEdit && (
            <Tooltip text="Edit board">
              <IconButton
                accessibilityLabel="Edit board"
                icon="edit"
                onClick={onEdit}
                size="lg"
                bgColor="transparent"
              />
            </Tooltip>
          )}

          {/* More Options Menu */}
          <Box>
            <Tooltip text="More options">
              <IconButton
                ref={(node) => setMenuAnchor(node)}
                accessibilityLabel="More options"
                accessibilityExpanded={showMenu}
                accessibilityHaspopup
                icon="ellipsis"
                onClick={() => setShowMenu(!showMenu)}
                size="lg"
                bgColor="transparent"
              />
            </Tooltip>

            {showMenu && menuAnchor && (
              <Dropdown
                anchor={menuAnchor}
                id="board-header-menu"
                onDismiss={() => setShowMenu(false)}
              >
                <Dropdown.Item
                  onSelect={handleShare}
                  option={{ value: 'share', label: 'Share board' }}
                />
                {onEdit && (
                  <>
                    <Dropdown.Item
                      onSelect={() => { setShowMenu(false); onEdit(); }}
                      option={{ value: 'edit', label: 'Edit board' }}
                    />
                    <Dropdown.Item
                      onSelect={handleDelete}
                      option={{ value: 'delete', label: 'Delete board' }}
                      badge={{ text: 'Danger' }}
                    />
                  </>
                )}
              </Dropdown>
            )}
          </Box>
        </Flex>

        {/* Selected Indicator */}
        {isSelected && (
          <Box 
            padding={3} 
            color="successBase" 
            rounding={3}
            marginTop={2}
          >
            <Flex alignItems="center" gap={2}>
              <Text color="inverse" size="200" weight="bold">
                ✓ New pins will be saved to this board
              </Text>
            </Flex>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default BoardHeader;