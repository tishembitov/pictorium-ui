// src/modules/board/components/BoardDropdown.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  TapArea, 
  Icon, 
  Spinner,
  Popover,
  Layer,
  SearchField,
  Divider,
  Button,
  Tooltip,
} from 'gestalt';
import { useMyBoards } from '../hooks/useMyBoards';
import { useMyBoardsForPin } from '../hooks/useMyBoardsForPin';
import { useSelectedBoardStore } from '../stores/selectedBoardStore';
import { useSelectBoard } from '../hooks/useSelectBoard';
import { BoardItem } from './BoardItem';
import { BoardCreateModal } from './BoardCreateModal';
import type { BoardResponse } from '../types/board.types';

// ==================== Types ====================

interface BoardDropdownProps {
  /** Pin ID - если передан, показывает какие доски уже содержат этот пин */
  pinId?: string;
  /** Callback при выборе доски */
  onBoardSelect?: (board: BoardResponse) => void;
  /** Callback при создании новой доски */
  onBoardCreate?: (board: BoardResponse) => void;
  /** Размер триггера */
  size?: 'sm' | 'md' | 'lg';
  /** Показывать только trigger без изменения глобального selected */
  localOnly?: boolean;
  /** Контролируемое значение (для localOnly режима) */
  value?: BoardResponse | null;
  /** Disabled состояние */
  disabled?: boolean;
  /** Показывать триггер как кнопку или как pill */
  variant?: 'pill' | 'button';
}

type DropdownSize = 'sm' | 'md' | 'lg';

// ==================== Size Config ====================

const getSizeConfig = (size: DropdownSize) => {
  const configs = {
    sm: { paddingX: 2 as const, paddingY: 1 as const, iconSize: 14 as const, textSize: '100' as const },
    md: { paddingX: 3 as const, paddingY: 2 as const, iconSize: 16 as const, textSize: '200' as const },
    lg: { paddingX: 4 as const, paddingY: 2 as const, iconSize: 20 as const, textSize: '300' as const },
  };
  return configs[size];
};

// ==================== Main Component ====================

export const BoardDropdown: React.FC<BoardDropdownProps> = ({
  pinId,
  onBoardSelect,
  onBoardCreate,
  size = 'md',
  localOnly = false,
  value,
  disabled = false,
  variant = 'pill',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);

  // Store (global selected board)
  const globalSelectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  const { selectBoard } = useSelectBoard();

  // Determine current selected board
  const currentBoard = localOnly ? value : globalSelectedBoard;

  // Fetch boards
  const { boards: simpleBoards, isLoading: isLoadingSimple } = useMyBoards({ 
    enabled: !pinId 
  });
  const { boards: boardsWithStatus, isLoading: isLoadingWithStatus } = useMyBoardsForPin(pinId, { 
    enabled: !!pinId 
  });

  const boards = pinId ? boardsWithStatus : simpleBoards;
  const isBoardsLoading = pinId ? isLoadingWithStatus : isLoadingSimple;

  // Filter boards
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(b => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  const showSearch = boards.length > 5;

  // ==================== Handlers ====================

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setSearchQuery('');
  }, [disabled]);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const handleBoardSelect = useCallback((board: BoardResponse) => {
    // Update global store if not localOnly
    if (!localOnly) {
      selectBoard(board.id);
    }
    
    onBoardSelect?.(board);
    setIsOpen(false);
  }, [localOnly, selectBoard, onBoardSelect]);

  const handleCreateNew = useCallback(() => {
    setIsOpen(false);
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback((boardId: string) => {
    // Find the created board (need to refetch)
    setTimeout(() => {
      const newBoard = boards.find(b => b.id === boardId);
      if (newBoard) {
        if (!localOnly) {
          selectBoard(boardId);
        }
        onBoardCreate?.(newBoard);
        onBoardSelect?.(newBoard);
      }
    }, 100);
    
    setShowCreateModal(false);
  }, [boards, localOnly, selectBoard, onBoardCreate, onBoardSelect]);

  // Callback ref для anchor
  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchorElement(node);
  }, []);

  // Size config
  const config = getSizeConfig(size);

  return (
    <>
      {/* Trigger */}
      <Tooltip text={currentBoard ? `Saving to: ${currentBoard.title}` : 'Select a board'}>
        <Box ref={setAnchorRef}>
          <TapArea onTap={handleToggle} rounding={variant === 'pill' ? 'pill' : 2} disabled={disabled}>
            <Box
              paddingX={config.paddingX}
              paddingY={config.paddingY}
              rounding={variant === 'pill' ? 'pill' : 2}
              color="secondary"
              display="flex"
              alignItems="center"
              dangerouslySetInlineStyle={{
                __style: {
                  opacity: disabled ? 0.6 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                },
              }}
            >
              <Flex alignItems="center" gap={1}>
                <Icon 
                  accessibilityLabel="" 
                  icon="board" 
                  size={config.iconSize} 
                  color="default" 
                />
                <Text 
                  size={config.textSize}
                  weight="bold" 
                  color="default"
                  lineClamp={1}
                >
                  {currentBoard?.title || 'Select board'}
                </Text>
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

      {/* Dropdown Popover */}
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
            <Box padding={4} width={320}>
              {/* Header */}
              <Box marginBottom={3}>
                <Text weight="bold" size="300" align="center">
                  {pinId ? 'Save to board' : 'Select board'}
                </Text>
              </Box>

              {/* Search */}
              {showSearch && (
                <Box marginBottom={3}>
                  <SearchField
                    id="board-dropdown-search"
                    accessibilityLabel="Search boards"
                    accessibilityClearButtonLabel="Clear"
                    placeholder="Search boards..."
                    value={searchQuery}
                    onChange={({ value }) => setSearchQuery(value)}
                    size="lg"
                  />
                </Box>
              )}

              {/* Create Board Button */}
              <Box marginBottom={2}>
                <Button
                  text="Create board"
                  onClick={handleCreateNew}
                  size="lg"
                  color="gray"
                  fullWidth
                  iconEnd="add"
                />
              </Box>

              <Divider />

              {/* Boards List */}
              <Box marginTop={2} maxHeight={280} overflow="scrollY">
                {isBoardsLoading ? (
                  <Box display="flex" justifyContent="center" padding={6}>
                    <Spinner accessibilityLabel="Loading boards" show />
                  </Box>
                ) : (
                  <Flex direction="column" gap={1}>
                    {filteredBoards.map((board) => (
                      <BoardItem
                        key={board.id}
                        board={board}
                        isSelected={currentBoard?.id === board.id}
                        onSelect={() => handleBoardSelect(board)}
                      />
                    ))}

                    {filteredBoards.length === 0 && searchQuery && (
                      <Box padding={4}>
                        <Text align="center" color="subtle" size="200">
                          No boards found
                        </Text>
                      </Box>
                    )}

                    {filteredBoards.length === 0 && !searchQuery && (
                      <Box padding={4}>
                        <Text align="center" color="subtle" size="200">
                          No boards yet. Create your first!
                        </Text>
                      </Box>
                    )}
                  </Flex>
                )}
              </Box>
            </Box>
          </Popover>
        </Layer>
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

export default BoardDropdown;