// src/modules/pin/components/PinSaveSection.tsx

import React, { useCallback, useState, useMemo } from 'react';
import { Box, Flex, Text, TapArea, Icon, Popover, Layer, Spinner, SearchField, Divider } from 'gestalt';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { 
  useMyBoardsForPin, 
  useSavePinToBoard,
  useRemovePinFromBoard,
  BoardPicker,
  BoardDropdownItem,
  BoardCreateModal,
} from '@/modules/board';
import { buildPath } from '@/app/router/routeConfig';
import { useToast } from '@/shared/hooks/useToast';
import { PinSaveButton } from './PinSaveButton';
import type { BoardResponse, BoardWithPinStatusResponse } from '@/modules/board';

interface PinSaveSectionProps {
  pinId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

/**
 * Ссылка на сохранённую доску для compact варианта
 */
const SavedBoardLink: React.FC<{
  board: BoardWithPinStatusResponse;
}> = ({ board }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      to={buildPath.board(board.id)} 
      style={{ textDecoration: 'none' }}
      onClick={(e) => e.stopPropagation()}
    >
      <Box
        paddingX={2}
        paddingY={1}
        rounding="pill"
        display="flex"
        alignItems="center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)',
            transition: 'background-color 0.15s ease',
            maxWidth: 120,
          },
        }}
      >
        <Text size="100" weight="bold" lineClamp={1} color="dark">
          {board.title}
        </Text>
      </Box>
    </Link>
  );
};

/**
 * Compact variant component для PinCard
 */
const CompactSaveSection: React.FC<{
  pinId: string;
  boards: BoardWithPinStatusResponse[];
  savedBoard: BoardWithPinStatusResponse | undefined;
  isBoardsLoading: boolean;
  isSaving: boolean;
  onSave: (board: BoardWithPinStatusResponse) => void;
  onUnsave: () => void;
  onCreateSuccess: (boardId: string) => void;
}> = ({
  pinId,
  boards,
  savedBoard,
  isBoardsLoading,
  isSaving,
  onSave,
  onUnsave,
  onCreateSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(b => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchorElement(node);
  }, []);

  const showSearch = boards.length > 5;

  // Если пин сохранён - показываем ссылку на доску + кнопку Saved
  if (savedBoard) {
    return (
      <Flex alignItems="center" gap={2}>
        <SavedBoardLink board={savedBoard} />
        
        <TapArea
          onTap={onUnsave}
          rounding="pill"
          disabled={isSaving}
        >
          <Box
            paddingX={3}
            paddingY={2}
            rounding="pill"
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: '#111',
                cursor: isSaving ? 'wait' : 'pointer',
                opacity: isSaving ? 0.8 : 1,
                transition: 'all 0.15s ease',
                minWidth: 56,
              },
            }}
          >
            {isSaving ? (
              <Spinner accessibilityLabel="Processing" show size="sm" />
            ) : (
              <Text color="inverse" weight="bold" size="200">
                Saved
              </Text>
            )}
          </Box>
        </TapArea>
      </Flex>
    );
  }

  // Если не сохранён - показываем кнопку Save с popup
  return (
    <>
      <Box ref={setAnchorRef}>
        <TapArea
          onTap={() => setIsOpen(true)}
          rounding="pill"
          disabled={isSaving}
        >
          <Box
            paddingX={4}
            paddingY={2}
            rounding="pill"
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: '#e60023',
                cursor: isSaving ? 'wait' : 'pointer',
                opacity: isSaving ? 0.8 : 1,
                transition: 'all 0.15s ease',
                minWidth: 60,
              },
            }}
          >
            {isSaving ? (
              <Spinner accessibilityLabel="Processing" show size="sm" />
            ) : (
              <Text color="inverse" weight="bold" size="200">
                Save
              </Text>
            )}
          </Box>
        </TapArea>
      </Box>

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
              <Box marginBottom={3}>
                <Text weight="bold" size="300" align="center">
                  Save to board
                </Text>
              </Box>

              {showSearch && (
                <Box marginBottom={3}>
                  <SearchField
                    id={`board-search-${pinId}`}
                    accessibilityLabel="Search boards"
                    accessibilityClearButtonLabel="Clear"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={({ value }) => setSearchQuery(value)}
                    size="lg"
                  />
                </Box>
              )}

              <Box maxHeight={280} overflow="scrollY">
                {isBoardsLoading ? (
                  <Box display="flex" justifyContent="center" padding={6}>
                    <Spinner accessibilityLabel="Loading boards" show />
                  </Box>
                ) : (
                  <Flex direction="column" gap={1}>
                    {filteredBoards.map((board) => (
                      <BoardDropdownItem
                        key={board.id}
                        board={board}
                        onSelect={(selectedBoard) => {
                          onSave(selectedBoard);
                          setIsOpen(false);
                        }}
                        isProcessing={isSaving}
                      />
                    ))}

                    {filteredBoards.length === 0 && (
                      <Box padding={4}>
                        <Text align="center" color="subtle">
                          {searchQuery ? 'No boards found' : 'No boards yet'}
                        </Text>
                      </Box>
                    )}
                  </Flex>
                )}
              </Box>

              <Divider />

              <Box marginTop={3}>
                <TapArea 
                  onTap={() => { setIsOpen(false); setShowCreateModal(true); }}
                  rounding={3}
                >
                  <Box padding={2} rounding={3}>
                    <Flex alignItems="center" gap={3}>
                      <Box
                        width={40}
                        height={40}
                        rounding="circle"
                        color="secondary"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon accessibilityLabel="" icon="add" size={16} />
                      </Box>
                      <Text weight="bold" size="200">
                        Create board
                      </Text>
                    </Flex>
                  </Box>
                </TapArea>
              </Box>
            </Box>
          </Popover>
        </Layer>
      )}

      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(boardId) => {
          onCreateSuccess(boardId);
          setShowCreateModal(false);
        }}
      />
    </>
  );
};

export const PinSaveSection: React.FC<PinSaveSectionProps> = ({
  pinId,
  size = 'md',
  variant = 'default',
}) => {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  const { 
    boards,
    isLoading: isBoardsLoading,
    refetch: refetchBoards,
  } = useMyBoardsForPin(pinId, { enabled: isAuthenticated });

  const savedBoard = useMemo(() => 
    boards.find(b => b.hasPin), 
    [boards]
  );

  const { savePinToBoard, isLoading: isSaving } = useSavePinToBoard({
    onSuccess: () => {
      void refetchBoards();
    },
    showToast: false,
  });

  const { removePinFromBoard, isLoading: isRemoving } = useRemovePinFromBoard({
    showToast: false,
    onSuccess: () => {
      setSelectedBoardId(null);
      void refetchBoards();
    },
  });

  const handleBoardChange = useCallback((board: BoardResponse | null) => {
    setSelectedBoardId(board?.id ?? null);
  }, []);

  const handleSave = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (!selectedBoardId) {
      toast.error('Please select a board first');
      return;
    }
    savePinToBoard({ boardId: selectedBoardId, pinId });
    toast.success('Saved!');
  }, [isAuthenticated, login, selectedBoardId, pinId, savePinToBoard, toast]);

  const handleUnsave = useCallback(() => {
    if (savedBoard) {
      removePinFromBoard({ boardId: savedBoard.id, pinId });
      toast.success('Removed from board');
    }
  }, [savedBoard, pinId, removePinFromBoard, toast]);

  const handleBoardSelect = useCallback((board: BoardWithPinStatusResponse) => {
    if (board.hasPin) return;
    savePinToBoard({ boardId: board.id, pinId });
    toast.success(`Saved to "${board.title}"`);
  }, [savePinToBoard, pinId, toast]);

  const handleCreateSuccess = useCallback((boardId: string) => {
    savePinToBoard({ boardId, pinId });
    toast.success('Saved to new board!');
  }, [savePinToBoard, pinId, toast]);

  const isLoading = isSaving || isRemoving;

  // Compact variant для PinCard
  if (variant === 'compact') {
    return (
      <CompactSaveSection
        pinId={pinId}
        boards={boards}
        savedBoard={savedBoard}
        isBoardsLoading={isBoardsLoading}
        isSaving={isLoading}
        onSave={handleBoardSelect}
        onUnsave={handleUnsave}
        onCreateSuccess={handleCreateSuccess}
      />
    );
  }

  // Default variant - для PinDetailHeader
  if (savedBoard) {
    return (
      <Flex alignItems="center" gap={3}>
        <Link 
          to={buildPath.board(savedBoard.id)} 
          style={{ textDecoration: 'none' }}
        >
          <TapArea rounding={2}>
            <Box
              paddingX={3}
              paddingY={2}
              rounding={2}
              color="secondary"
              display="flex"
              alignItems="center"
            >
              <Flex alignItems="center" gap={2}>
                <Icon accessibilityLabel="" icon="board" size={16} color="default" />
                <Text weight="bold" size="200">
                  {savedBoard.title}
                </Text>
                <Icon accessibilityLabel="" icon="visit" size={12} color="subtle" />
              </Flex>
            </Box>
          </TapArea>
        </Link>

        <PinSaveButton
          isSaved={true}
          onUnsave={handleUnsave}
          isLoading={isLoading}
          size={size}
        />
      </Flex>
    );
  }

  return (
    <Flex alignItems="center" gap={3}>
      <BoardPicker
        onBoardChange={handleBoardChange}
        size={size}
        showLabel
        allowDeselect={false}
      />

      <PinSaveButton
        isSaved={false}
        onSave={handleSave}
        isLoading={isLoading}
        size={size}
      />
    </Flex>
  );
};

export default PinSaveSection;