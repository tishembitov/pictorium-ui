// src/modules/board/components/BoardPicker.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Box, 
  Tooltip, 
  Flex, 
  Text, 
  SearchField,
  TapArea,
  Icon,
  Divider,
  Popover,
  Layer,
  Spinner,
  Button,
} from 'gestalt';
import { useMyBoards } from '../hooks/useMyBoards';
import { useSelectedBoard } from '../hooks/useSelectedBoard';
import { useSelectBoard } from '../hooks/useSelectBoard';
import { BoardCreateModal } from './BoardCreateModal';
import { useBoardPins } from '../hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';
import type { BoardResponse } from '../types/board.types';

interface BoardPickerProps {
  onBoardChange?: (board: BoardResponse | null) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// Profile option item
const ProfilePickerItem: React.FC<{
  isSelected: boolean;
  onSelect: () => void;
}> = ({ isSelected, onSelect }) => {
  return (
    <TapArea onTap={onSelect} rounding={2}>
      <Box
        paddingY={2}
        paddingX={2}
        rounding={2}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'all 0.15s ease',
            border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
            backgroundColor: isSelected ? 'rgba(230, 0, 35, 0.08)' : 'transparent',
          },
        }}
      >
        <Flex alignItems="center" gap={2}>
          {/* Profile Icon */}
          <Box
            width={36}
            height={36}
            rounding={2}
            color="secondary"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon accessibilityLabel="" icon="person" size={16} color="default" />
          </Box>

          {/* Title */}
          <Box flex="grow">
            <Text weight={isSelected ? 'bold' : 'normal'} size="200">
              Profile
            </Text>
          </Box>

          {/* Check */}
          {isSelected && (
            <Icon accessibilityLabel="Selected" icon="check" size={14} color="success" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

// Board item for picker
const BoardPickerItem: React.FC<{
  board: BoardResponse;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ board, isSelected, onSelect }) => {
  const { pins } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  return (
    <TapArea onTap={onSelect} rounding={2}>
      <Box
        paddingY={2}
        paddingX={2}
        rounding={2}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'all 0.15s ease',
            border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
            backgroundColor: isSelected ? 'rgba(230, 0, 35, 0.08)' : 'transparent',
          },
        }}
      >
        <Flex alignItems="center" gap={2}>
          {/* Mini Cover */}
          <Box
            width={36}
            height={36}
            rounding={2}
            overflow="hidden"
            color="secondary"
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: coverData?.url ? {
                backgroundImage: `url(${coverData.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {},
            }}
          >
            {!coverData?.url && (
              <Icon accessibilityLabel="" icon="board" size={16} color="subtle" />
            )}
          </Box>

          {/* Title */}
          <Box flex="grow">
            <Text weight={isSelected ? 'bold' : 'normal'} size="200" lineClamp={1}>
              {board.title}
            </Text>
          </Box>

          {/* Check */}
          {isSelected && (
            <Icon accessibilityLabel="Selected" icon="check" size={14} color="success" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

export const BoardPicker: React.FC<BoardPickerProps> = ({
  onBoardChange,
  size = 'md',
  showLabel = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);

  const { boards, isLoading: isBoardsLoading } = useMyBoards();
  const { selectedBoard } = useSelectedBoard();
  const { selectBoard, switchToProfile } = useSelectBoard();

  const isProfileMode = selectedBoard === null;

  // Filter boards
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(b => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setSearchQuery('');
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleProfileSelect = useCallback(() => {
    switchToProfile();
    onBoardChange?.(null);
    setIsOpen(false);
  }, [switchToProfile, onBoardChange]);

  const handleBoardSelect = useCallback((board: BoardResponse) => {
    selectBoard(board.id);
    onBoardChange?.(board);
    setIsOpen(false);
  }, [selectBoard, onBoardChange]);

  const handleCreateNew = useCallback(() => {
    setIsOpen(false);
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback((boardId: string) => {
    selectBoard(boardId);
    setShowCreateModal(false);
  }, [selectBoard]);

  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchorElement(node);
  }, []);

  // Размеры в зависимости от size
  const paddingX = size === 'sm' ? 2 : 3;
  const paddingY = size === 'sm' ? 1 : 2;
  const iconSize = size === 'sm' ? 14 : 16;

  // Определяем что показывать в кнопке
  const displayText = isProfileMode ? 'Profile' : selectedBoard?.title;
  const displayIcon = isProfileMode ? 'person' : 'board';

  return (
    <>
      <Tooltip text={isProfileMode ? 'Saving to Profile' : `Saving to: ${selectedBoard?.title}`}>
        <Box ref={setAnchorRef}>
          <TapArea onTap={handleToggle} rounding="pill">
            <Box
              paddingX={paddingX}
              paddingY={paddingY}
              rounding="pill"
              color="secondary"
              display="flex"
              alignItems="center"
            >
              <Flex alignItems="center" gap={1}>
                <Icon 
                  accessibilityLabel="" 
                  icon={displayIcon} 
                  size={iconSize} 
                  color="default" 
                />
                {(showLabel || selectedBoard || isProfileMode) && (
                  <Text 
                    size="200"
                    weight="bold" 
                    color="default"
                    lineClamp={1}
                  >
                    {displayText}
                  </Text>
                )}
                <Icon 
                  accessibilityLabel="" 
                  icon="arrow-down" 
                  size={10} 
                  color="default" 
                />
              </Flex>
            </Box>
          </TapArea>
        </Box>
      </Tooltip>

      {isOpen && anchorElement && (
        <Layer>
          <Popover
            anchor={anchorElement}
            onDismiss={handleDismiss}
            idealDirection="down"
            positionRelativeToAnchor={false}
            size="flexible"
            color="white"
          >
            <Box padding={3} width={260}>
              {/* Header */}
              <Box marginBottom={2}>
                <Text weight="bold" size="300">
                  Save to
                </Text>
                <Text color="subtle" size="100">
                  Choose where to save new pins
                </Text>
              </Box>

              {/* Search - только если много досок */}
              {boards.length > 4 && (
                <Box marginBottom={2}>
                  <SearchField
                    id="board-picker-search"
                    accessibilityLabel="Search boards"
                    accessibilityClearButtonLabel="Clear"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={({ value }) => setSearchQuery(value)}
                    size="md"
                  />
                </Box>
              )}

              {/* Create New Button */}
              <Box marginBottom={2}>
                <Button
                  text="Create board"
                  onClick={handleCreateNew}
                  size="md"
                  color="gray"
                  fullWidth
                  iconEnd="add"
                />
              </Box>

              <Divider />

              {/* Options List */}
              <Box marginTop={2}>
                {isBoardsLoading ? (
                  <Box display="flex" justifyContent="center" padding={3}>
                    <Spinner accessibilityLabel="Loading boards" show size="sm" />
                  </Box>
                ) : (
                  <Box maxHeight={200} overflow="scrollY">
                    <Flex direction="column" gap={1}>
                      {/* Profile Option - First */}
                      <ProfilePickerItem
                        isSelected={isProfileMode}
                        onSelect={handleProfileSelect}
                      />

                      {/* Divider between Profile and Boards */}
                      {filteredBoards.length > 0 && (
                        <Box paddingY={1}>
                          <Divider />
                        </Box>
                      )}

                      {/* Boards */}
                      {filteredBoards.map((board) => (
                        <BoardPickerItem
                          key={board.id}
                          board={board}
                          isSelected={selectedBoard?.id === board.id}
                          onSelect={() => handleBoardSelect(board)}
                        />
                      ))}

                      {/* No results */}
                      {filteredBoards.length === 0 && searchQuery && (
                        <Box padding={3}>
                          <Text align="center" color="subtle" size="100">
                            No boards found
                          </Text>
                        </Box>
                      )}
                    </Flex>
                  </Box>
                )}
              </Box>
            </Box>
          </Popover>
        </Layer>
      )}

      {/* Create Modal */}
      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default BoardPicker;