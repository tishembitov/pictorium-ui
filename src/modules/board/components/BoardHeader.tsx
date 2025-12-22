// src/modules/board/components/BoardHeader.tsx

import React, { useState, useCallback } from 'react';
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
  Icon,
} from 'gestalt';
import { useDeleteBoard } from '../hooks/useDeleteBoard';
import { useSelectBoard } from '../hooks/useSelectBoard';
import { useSelectedBoard } from '../hooks/useSelectedBoard';
import { useConfirmModal } from '@/shared/hooks/useConfirmModal';
import { useToast } from '@/shared/hooks/useToast';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { formatCompactNumber } from '@/shared/utils/formatters';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import type { BoardResponse } from '../types/board.types';

interface BoardHeaderProps {
  board: BoardResponse;
  pinCount?: number;
  onBack?: () => void;
  onEdit?: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  pinCount = 0,
  onBack,
  onEdit,
}) => {
  const navigate = useNavigate();
  const { confirm } = useConfirmModal();
  const { toast } = useToast();
  const { copy } = useCopyToClipboard();
  const [showMenu, setShowMenu] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const { selectedBoard } = useSelectedBoard();
  const { selectBoard, deselectBoard, isLoading: isSelecting } = useSelectBoard();
  const { deleteBoard } = useDeleteBoard();

  const isSelected = selectedBoard?.id === board.id;

  // Build share URL
  const shareUrl = `${globalThis.location.origin}/board/${board.id}`;

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
      toast.success(`New pins will be saved to "${board.title}"`);
    }
  };

  // Share handlers
  const handleCopyLink = useCallback(async () => {
    const success = await copy(shareUrl);
    if (success) {
      toast.success(SUCCESS_MESSAGES.COPIED_TO_CLIPBOARD);
    }
    setShowMenu(false);
  }, [copy, shareUrl, toast]);

  const handleShareTwitter = useCallback(() => {
    const text = `Check out my board: ${board.title}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setShowMenu(false);
  }, [board.title, shareUrl]);

  const handleShareFacebook = useCallback(() => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setShowMenu(false);
  }, [shareUrl]);

  const handleSharePinterest = useCallback(() => {
    const url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(board.title)}`;
    globalThis.open(url, '_blank', 'noopener,noreferrer');
    setShowMenu(false);
  }, [board.title, shareUrl]);

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

  return (
    <Box paddingY={6}>
      {/* Back Button - Absolute positioned */}
      <Box 
        position="absolute" 
        dangerouslySetInlineStyle={{ __style: { left: 16, top: 24 } }}
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
        {/* Selected Badge */}
        {isSelected && (
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
        <Heading size="500" align="center" accessibilityLevel={1}>
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
            text={isSelected ? 'Deselect' : 'Set as default'}
            onClick={handleSelectBoard}
            size="lg"
            color={isSelected ? 'gray' : 'red'}
            disabled={isSelecting}
            iconEnd={isSelected ? undefined : 'add-pin'}
          />

          {/* Edit Button */}
          {onEdit && (
            <Tooltip text="Edit board">
              <IconButton
                accessibilityLabel="Edit board"
                icon="edit"
                onClick={onEdit}
                size="lg"
                bgColor="gray"
              />
            </Tooltip>
          )}

          {/* More Options Menu - Pinterest style */}
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
                bgColor="gray"
              />
            </Tooltip>

            {showMenu && menuAnchor && (
              <Dropdown
                anchor={menuAnchor}
                id="board-header-menu"
                onDismiss={() => setShowMenu(false)}
              >
                {/* Share Options */}
                <Dropdown.Section label="Share">
                  <Dropdown.Item
                    onSelect={handleCopyLink}
                    option={{ value: 'copy', label: 'Copy link' }}
                  />
                  <Dropdown.Item
                    onSelect={handleShareTwitter}
                    option={{ value: 'twitter', label: 'Share on Twitter' }}
                  />
                  <Dropdown.Item
                    onSelect={handleShareFacebook}
                    option={{ value: 'facebook', label: 'Share on Facebook' }}
                  />
                  <Dropdown.Item
                    onSelect={handleSharePinterest}
                    option={{ value: 'pinterest', label: 'Share on Pinterest' }}
                  />
                </Dropdown.Section>

                {/* Board Actions */}
                {onEdit && (
                  <Dropdown.Section label="Board">
                    <Dropdown.Item
                      onSelect={() => { setShowMenu(false); onEdit(); }}
                      option={{ value: 'edit', label: 'Edit board' }}
                    />
                    <Dropdown.Item
                      onSelect={handleDelete}
                      option={{ value: 'delete', label: 'Delete board' }}
                      badge={{ text: 'Danger' }}
                    />
                  </Dropdown.Section>
                )}
              </Dropdown>
            )}
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};

export default BoardHeader;