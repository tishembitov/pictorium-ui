// src/modules/board/components/BoardDropdown.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  TapArea, 
  Icon, 
  Popover, 
  Layer, 
  SearchField,
  Spinner,
  Divider,
  Button,
} from 'gestalt';
import { useMyBoards } from '../hooks/useMyBoards';
import { useMyBoardsForPin } from '../hooks/useMyBoardsForPin';
import { useSelectedBoard } from '../hooks/useSelectedBoard';
import { useSelectBoard } from '../hooks/useSelectBoard';
import { useBoardPins } from '../hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';
import { BoardCreateModal } from './BoardCreateModal';
import type { BoardResponse, BoardWithPinStatusResponse } from '../types/board.types';

interface BoardDropdownProps {
  /** Если передан - показывает статус hasPin и используется для создания доски с пином */
  pinId?: string;
  onBoardSelect?: (board: BoardResponse) => void;
  size?: 'sm' | 'md' | 'lg';
  localOnly?: boolean;
  value?: BoardResponse | null;
}

// Отдельный компонент для превью доски
const BoardPreview: React.FC<{ board: BoardResponse }> = ({ board }) => {
  const { pins } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  return (
    <Box
      width={32}
      height={32}
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
  );
};

// Элемент списка досок
const BoardDropdownItem: React.FC<{
  board: BoardResponse | BoardWithPinStatusResponse;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}> = ({ board, isSelected, onSelect, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasPin = 'hasPin' in board ? board.hasPin : false;
  const pinCount = 'pinCount' in board ? board.pinCount : 0;
  const isDisabled = disabled || hasPin;

  return (
    <TapArea 
      onTap={() => !isDisabled && onSelect()} 
      rounding={2}
      disabled={isDisabled}
    >
      <Box
        padding={2}
        rounding={2}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: hasPin 
              ? 'rgba(0, 128, 0, 0.08)'
              : isSelected 
                ? 'rgba(230, 0, 35, 0.08)' 
                : isHovered 
                  ? '#f5f5f5' 
                  : 'transparent',
            cursor: isDisabled ? 'default' : 'pointer',
            transition: 'all 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          <BoardPreview board={board} />
          
          <Box flex="grow">
            <Text weight={isSelected || hasPin ? 'bold' : 'normal'} size="200" lineClamp={1}>
              {board.title}
            </Text>
            <Text color="subtle" size="100">
              {pinCount} pins
            </Text>
          </Box>

          {hasPin && (
            <Flex alignItems="center" gap={1}>
              <Icon accessibilityLabel="Saved" icon="check-circle" size={14} color="success" />
              <Text size="100" color="success" weight="bold">
                Saved
              </Text>
            </Flex>
          )}
          
          {isSelected && !hasPin && (
            <Icon accessibilityLabel="Selected" icon="check" size={16} color="default" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

export const BoardDropdown: React.FC<BoardDropdownProps> = ({
  pinId,
  onBoardSelect,
  size = 'md',
  localOnly = false,
  value,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);

  // Если есть pinId - используем useMyBoardsForPin для статуса hasPin
  const { 
    boards: boardsWithStatus, 
    isLoading: isLoadingWithStatus,
    refetch: refetchBoardsForPin, 
  } = useMyBoardsForPin(pinId, { enabled: !!pinId && isOpen });

  // Обычный список досок
  const { boards: allBoards, isLoading: isLoadingBoards } = useMyBoards({ 
    enabled: !pinId && isOpen 
  });

  const boards = pinId ? boardsWithStatus : allBoards;
  const isLoading = pinId ? isLoadingWithStatus : isLoadingBoards;

  // Selected board from store or prop
  const { selectedBoard: storeSelectedBoard } = useSelectedBoard();
  const { selectBoard } = useSelectBoard();
  
  const selectedBoard = localOnly ? value : storeSelectedBoard;

  // Filter boards
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(b => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  // Callback ref для сохранения элемента в state
  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchorElement(node);
  }, []);

  // Handlers
  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleBoardSelect = useCallback((board: BoardResponse | BoardWithPinStatusResponse) => {
    if ('hasPin' in board && board.hasPin) return;
    
    if (!localOnly) {
      selectBoard(board.id);
    }
    onBoardSelect?.(board);
    setIsOpen(false);
    setSearchQuery('');
  }, [localOnly, selectBoard, onBoardSelect]);

  const handleCreateNew = useCallback(() => {
    setIsOpen(false);
    setShowCreateModal(true);
  }, []);

  // ✅ Обработчик успешного создания - modal уже сохранил пин
  const handleCreateSuccess = useCallback((boardId: string) => {
    // Выбираем новую доску
    if (!localOnly) {
      selectBoard(boardId);
    }
    
    // Если есть pinId - refetch списка досок
    if (pinId) {
      void refetchBoardsForPin();
    }
    
    setShowCreateModal(false);
  }, [localOnly, selectBoard, pinId, refetchBoardsForPin]);

  // Button sizing
  const buttonHeight = size === 'lg' ? 48 : size === 'sm' ? 32 : 40;
  const iconSize = size === 'lg' ? 20 : 16;

  return (
    <>
      {/* Trigger Button */}
      <Box ref={setAnchorRef}>
        <TapArea onTap={handleToggle} rounding={2}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="between"
            paddingX={3}
            rounding={2}
            color="secondary"
            dangerouslySetInlineStyle={{
              __style: {
                height: buttonHeight,
                minWidth: 140,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              },
            }}
          >
            <Flex alignItems="center" gap={2} flex="grow">
              {selectedBoard ? (
                <>
                  <BoardPreview board={selectedBoard} />
                  <Text weight="bold" size="200" lineClamp={1}>
                    {selectedBoard.title}
                  </Text>
                </>
              ) : (
                <>
                  <Icon accessibilityLabel="" icon="board" size={iconSize} color="default" />
                  <Text size="200" color="subtle">
                    Select board
                  </Text>
                </>
              )}
            </Flex>
            <Icon
              accessibilityLabel=""
              icon={isOpen ? 'arrow-up' : 'arrow-down'}
              size={12}
              color="default"
            />
          </Box>
        </TapArea>
      </Box>

      {/* Dropdown */}
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
            <Box padding={3} width={280}>
              {/* Header */}
              <Box marginBottom={2}>
                <Text weight="bold" size="300" align="center">
                  {pinId ? 'Save to board' : 'Select board'}
                </Text>
              </Box>

              {/* Search */}
              {boards.length > 5 && (
                <Box marginBottom={2}>
                  <SearchField
                    id="board-dropdown-search"
                    accessibilityLabel="Search boards"
                    accessibilityClearButtonLabel="Clear"
                    placeholder="Search boards"
                    value={searchQuery}
                    onChange={({ value }) => setSearchQuery(value)}
                    size="md"
                  />
                </Box>
              )}

              {/* Boards List */}
              <Box maxHeight={240} overflow="scrollY">
                {isLoading ? (
                  <Box display="flex" justifyContent="center" padding={4}>
                    <Spinner accessibilityLabel="Loading" show size="sm" />
                  </Box>
                ) : filteredBoards.length === 0 ? (
                  <Box padding={4}>
                    <Text align="center" color="subtle" size="200">
                      {searchQuery ? 'No boards found' : 'No boards yet'}
                    </Text>
                  </Box>
                ) : (
                  <Flex direction="column" gap={1}>
                    {filteredBoards.map((board) => (
                      <BoardDropdownItem
                        key={board.id}
                        board={board}
                        isSelected={selectedBoard?.id === board.id}
                        onSelect={() => handleBoardSelect(board)}
                      />
                    ))}
                  </Flex>
                )}
              </Box>

              <Divider />

              {/* Create Board */}
              <Box marginTop={2}>
                <Button
                  text="Create board"
                  onClick={handleCreateNew}
                  size="md"
                  color="gray"
                  fullWidth
                  iconEnd="add"
                />
              </Box>
            </Box>
          </Popover>
        </Layer>
      )}

      {/* ✅ Create Board Modal с pinId - сохранит пин автоматически */}
      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        pinId={pinId}
      />
    </>
  );
};

export default BoardDropdown;