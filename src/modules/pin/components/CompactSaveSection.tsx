// src/modules/pin/components/CompactSaveSection.tsx

import React, { useCallback, useMemo, useState } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  TapArea, 
  Spinner,
  Icon,
  Popover,
  Layer,
  SearchField,
  Divider,
} from 'gestalt';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { 
  useMyBoardsForPin, 
  useSavePinToBoard,
  useRemovePinFromBoard,
  BoardCreateModal,
  useSelectedBoardStore,
  useSelectBoard,
} from '@/modules/board';
import { useBoardPins } from '@/modules/board/hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';
import { useToast } from '@/shared/hooks/useToast';
import { useConfirmModal } from '@/shared/hooks/useConfirmModal';
import { buildPath } from '@/app/router/routeConfig';
import type { BoardWithPinStatusResponse } from '@/modules/board';

// ==================== Types ====================

interface CompactSaveSectionProps {
  pinId: string;
  pinTitle?: string | null;
  lastSavedBoardId: string | null;
  lastSavedBoardName: string | null;
  savedToBoardsCount: number;
}

// ==================== Sub-components ====================

const BoardPreviewImage: React.FC<{ boardId: string; size?: number }> = ({ 
  boardId, 
  size = 32 
}) => {
  const { pins } = useBoardPins(boardId, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  return (
    <Box
      width={size}
      height={size}
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
        <Icon accessibilityLabel="" icon="board" size={12} color="subtle" />
      )}
    </Box>
  );
};

const CompactBoardItem: React.FC<{
  board: BoardWithPinStatusResponse;
  onSave: () => void;
  onRemove: () => void;
  isSaving: boolean;
  isRemoving: boolean;
}> = ({ board, onSave, onRemove, isSaving, isRemoving }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isProcessing = isSaving || isRemoving;

  return (
    <Box
      padding={2}
      rounding={2}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: board.hasPin 
            ? 'rgba(0, 132, 80, 0.06)'
            : isHovered 
              ? 'rgba(0, 0, 0, 0.04)' 
              : 'transparent',
          transition: 'background-color 0.15s ease',
        },
      }}
    >
      <Flex alignItems="center" gap={2}>
        {/* Board preview - link to board if saved */}
        {board.hasPin ? (
          <Link 
            to={buildPath.board(board.id)} 
            style={{ textDecoration: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            <BoardPreviewImage boardId={board.id} size={36} />
          </Link>
        ) : (
          <BoardPreviewImage boardId={board.id} size={36} />
        )}
        
        {/* Board info - link to board if saved */}
        <Box flex="grow">
          {board.hasPin ? (
            <Link 
              to={buildPath.board(board.id)} 
              style={{ textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Text weight="bold" size="200" lineClamp={1}>
                {board.title}
              </Text>
              <Text color="subtle" size="100">
                {board.pinCount} pins
              </Text>
            </Link>
          ) : (
            <>
              <Text weight="bold" size="200" lineClamp={1}>
                {board.title}
              </Text>
              <Text color="subtle" size="100">
                {board.pinCount} pins
              </Text>
            </>
          )}
        </Box>

        {/* Action buttons */}
        <Box minWidth={70} display="flex" justifyContent="end">
          {isProcessing ? (
            <Box paddingX={2}>
              <Spinner accessibilityLabel="Processing" show size="sm" />
            </Box>
          ) : board.hasPin ? (
            // Saved state - show remove button
            <TapArea 
              onTap={onRemove} 
              rounding={2}
            >
              <Box
                paddingX={2}
                paddingY={1}
                rounding={2}
                dangerouslySetInlineStyle={{
                  __style: {
                    backgroundColor: isHovered ? 'rgba(180, 0, 0, 0.1)' : 'transparent',
                    border: '1px solid',
                    borderColor: isHovered ? '#b40000' : '#cdcdcd',
                    transition: 'all 0.15s ease',
                  },
                }}
              >
                <Flex alignItems="center" gap={1}>
                  <Icon 
                    accessibilityLabel="" 
                    icon="check" 
                    size={12} 
                    color={isHovered ? 'error' : 'success'} 
                  />
                  <Text 
                    size="100" 
                    weight="bold" 
                    color={isHovered ? 'error' : 'success'}
                  >
                    {isHovered ? 'Remove' : 'Saved'}
                  </Text>
                </Flex>
              </Box>
            </TapArea>
          ) : (
            // Not saved - show save button
            <TapArea onTap={onSave} rounding={2}>
              <Box
                paddingX={2}
                paddingY={1}
                rounding={2}
                dangerouslySetInlineStyle={{
                  __style: {
                    backgroundColor: isHovered ? '#e60023' : 'transparent',
                    border: '1px solid',
                    borderColor: isHovered ? '#e60023' : '#cdcdcd',
                    transition: 'all 0.15s ease',
                  },
                }}
              >
                <Text 
                  size="100" 
                  weight="bold" 
                  color={isHovered ? 'inverse' : 'default'}
                >
                  Save
                </Text>
              </Box>
            </TapArea>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

// ==================== Main Component ====================

export const CompactSaveSection: React.FC<CompactSaveSectionProps> = ({
  pinId,
  pinTitle,
  lastSavedBoardId,
  lastSavedBoardName,
  savedToBoardsCount,
}) => {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirmModal();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingToBoardId, setSavingToBoardId] = useState<string | null>(null);
  const [removingFromBoardId, setRemovingFromBoardId] = useState<string | null>(null);
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);
  
  // Локальное состояние для немедленного UI обновления
  const [localSaveInfo, setLocalSaveInfo] = useState<{
    boardId: string;
    boardName: string;
    count: number;
  } | null>(null);

  // Store
  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  const { selectBoard } = useSelectBoard();

  // Boards data
  const { 
    boards,
    isLoading: isBoardsLoading,
    refetch: refetchBoards,
  } = useMyBoardsForPin(pinId, { enabled: isAuthenticated && isDropdownOpen });

  // Mutations
  const { savePinToBoard, isLoading: isSavingToBoard } = useSavePinToBoard({
    showToast: false,
    onSuccess: (boardId, boardName) => {
      setLocalSaveInfo({ 
        boardId, 
        boardName, 
        count: (localSaveInfo?.count ?? savedToBoardsCount) + 1 
      });
      setSavingToBoardId(null);
      void refetchBoards();
      
      toast.success(`Saved to "${boardName}"`);
    },
  });

  const { removePinFromBoard } = useRemovePinFromBoard({
    showToast: false,
    onSuccess: () => {
      setRemovingFromBoardId(null);
      // Обновляем локальное состояние
      const newCount = (localSaveInfo?.count ?? savedToBoardsCount) - 1;
      if (newCount <= 0) {
        setLocalSaveInfo(null);
      } else {
        // Найти следующую сохранённую доску
        const remainingSaved = boards.filter(b => b.hasPin && b.id !== removingFromBoardId);
        if (remainingSaved.length > 0 && remainingSaved[0]) {
          setLocalSaveInfo({
            boardId: remainingSaved[0].id,
            boardName: remainingSaved[0].title,
            count: newCount,
          });
        }
      }
      void refetchBoards();
      toast.success('Removed from board');
    },
    onError: () => {
      setRemovingFromBoardId(null);
    },
  });

  // Computed values
  const isSaved = useMemo(() => {
    return localSaveInfo !== null || savedToBoardsCount > 0;
  }, [localSaveInfo, savedToBoardsCount]);

  const currentSaveInfo = useMemo(() => {
    if (localSaveInfo) {
      return localSaveInfo;
    }
    if (lastSavedBoardId && lastSavedBoardName) {
      return { 
        boardId: lastSavedBoardId, 
        boardName: lastSavedBoardName,
        count: savedToBoardsCount,
      };
    }
    return null;
  }, [localSaveInfo, lastSavedBoardId, lastSavedBoardName, savedToBoardsCount]);

  const displayBoardName = useMemo(() => {
    if (currentSaveInfo) return currentSaveInfo.boardName;
    if (selectedBoard) return selectedBoard.title;
    return 'Board';
  }, [currentSaveInfo, selectedBoard]);

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(b => b.title.toLowerCase().includes(query));
  }, [boards, searchQuery]);

  const currentCount = localSaveInfo?.count ?? savedToBoardsCount;
  const savedBoardsCount = boards.filter(b => b.hasPin).length;

  // ==================== Handlers ====================

  const handleDropdownToggle = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setIsDropdownOpen(prev => !prev);
  }, [isAuthenticated, login]);

  const handleDropdownDismiss = useCallback(() => {
    setIsDropdownOpen(false);
    setSearchQuery('');
  }, []);

  const handleQuickSave = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    // Если уже сохранён - открываем dropdown для управления
    if (isSaved) {
      setIsDropdownOpen(true);
      return;
    }

    // Если нет выбранной доски - открываем dropdown
    if (!selectedBoard) {
      setIsDropdownOpen(true);
      return;
    }

    // Проверяем, не сохранён ли уже в выбранную доску
    const alreadySaved = boards.find(b => b.id === selectedBoard.id)?.hasPin;
    if (alreadySaved) {
      setIsDropdownOpen(true);
      return;
    }

    // Quick save в выбранную доску
    setSavingToBoardId(selectedBoard.id);
    savePinToBoard({ boardId: selectedBoard.id, pinId });
  }, [isAuthenticated, login, isSaved, selectedBoard, boards, savePinToBoard, pinId]);

  const handleSaveToBoard = useCallback((board: BoardWithPinStatusResponse) => {
    if (board.hasPin) return;
    
    setSavingToBoardId(board.id);
    savePinToBoard({ boardId: board.id, pinId });
    selectBoard(board.id);
  }, [savePinToBoard, pinId, selectBoard]);

  const handleRemoveFromBoard = useCallback((board: BoardWithPinStatusResponse) => {
    confirm({
      title: 'Remove from board?',
      message: `Remove this pin from "${board.title}"?`,
      confirmText: 'Remove',
      destructive: true,
      onConfirm: () => {
        setRemovingFromBoardId(board.id);
        removePinFromBoard({ boardId: board.id, pinId });
      },
    });
  }, [confirm, removePinFromBoard, pinId]);

  const handleCreateNew = useCallback(() => {
    setIsDropdownOpen(false);
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback((boardId: string) => {
    const newBoard = boards.find(b => b.id === boardId);
    setLocalSaveInfo({ 
      boardId, 
      boardName: newBoard?.title || 'New Board',
      count: (localSaveInfo?.count ?? savedToBoardsCount) + 1,
    });
    selectBoard(boardId);
    setShowCreateModal(false);
    void refetchBoards();
  }, [boards, selectBoard, refetchBoards, localSaveInfo, savedToBoardsCount]);

  // Callback ref для anchor
  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    setAnchorElement(node);
  }, []);

  // ==================== Render ====================

  const isLoading = isSavingToBoard || savingToBoardId !== null;

  // Если сохранено - показываем название доски + кнопку Saved
  if (isSaved && currentSaveInfo) {
    return (
      <>
        <Flex alignItems="center" gap={1}>
          {/* Board Name - clickable to open dropdown or navigate */}
          {currentCount === 1 ? (
            // Одна доска - прямая ссылка
            <Link 
              to={buildPath.board(currentSaveInfo.boardId)} 
              style={{ textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Box
                paddingX={2}
                paddingY={1}
                rounding={2}
                dangerouslySetInlineStyle={{
                  __style: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    maxWidth: 100,
                    cursor: 'pointer',
                  },
                }}
              >
                <Text size="100" weight="bold" lineClamp={1} color="dark">
                  {currentSaveInfo.boardName}
                </Text>
              </Box>
            </Link>
          ) : (
            // Несколько досок - открываем dropdown для управления
            <Box ref={setAnchorRef}>
              <TapArea onTap={handleDropdownToggle} rounding={2}>
                <Box
                  paddingX={2}
                  paddingY={1}
                  rounding={2}
                  dangerouslySetInlineStyle={{
                    __style: {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      maxWidth: 120,
                      cursor: 'pointer',
                    },
                  }}
                >
                  <Flex alignItems="center" gap={1}>
                    <Text size="100" weight="bold" lineClamp={1} color="dark">
                      {currentSaveInfo.boardName}
                    </Text>
                    <Text size="100" color="subtle">
                      +{currentCount - 1}
                    </Text>
                  </Flex>
                </Box>
              </TapArea>
            </Box>
          )}

          {/* Saved Button - opens dropdown to manage saves */}
          {currentCount === 1 && (
            <Box ref={setAnchorRef}>
              <TapArea 
                onTap={handleDropdownToggle} 
                rounding="pill" 
                disabled={isLoading}
                tapStyle="compress"
              >
                <Box
                  paddingX={3}
                  paddingY={2}
                  rounding="pill"
                  dangerouslySetInlineStyle={{
                    __style: {
                      backgroundColor: '#111',
                      opacity: isLoading ? 0.7 : 1,
                      cursor: isLoading ? 'wait' : 'pointer',
                      transition: 'all 0.15s ease',
                      minWidth: 56,
                      display: 'flex',
                      justifyContent: 'center',
                    },
                  }}
                >
                  {isLoading ? (
                    <Spinner accessibilityLabel="Saving" show size="sm" />
                  ) : (
                    <Text color="inverse" weight="bold" size="200">
                      Saved
                    </Text>
                  )}
                </Box>
              </TapArea>
            </Box>
          )}

          {currentCount > 1 && (
            <TapArea 
              onTap={handleDropdownToggle} 
              rounding="pill" 
              disabled={isLoading}
              tapStyle="compress"
            >
              <Box
                paddingX={3}
                paddingY={2}
                rounding="pill"
                dangerouslySetInlineStyle={{
                  __style: {
                    backgroundColor: '#111',
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'wait' : 'pointer',
                    transition: 'all 0.15s ease',
                    minWidth: 56,
                    display: 'flex',
                    justifyContent: 'center',
                  },
                }}
              >
                {isLoading ? (
                  <Spinner accessibilityLabel="Saving" show size="sm" />
                ) : (
                  <Text color="inverse" weight="bold" size="200">
                    Saved
                  </Text>
                )}
              </Box>
            </TapArea>
          )}
        </Flex>

        {/* Dropdown for managing saves */}
        {isDropdownOpen && anchorElement && (
          <Layer>
            <Popover
              anchor={anchorElement}
              onDismiss={handleDropdownDismiss}
              idealDirection="down"
              positionRelativeToAnchor={false}
              size="flexible"
              color="white"
            >
              <Box padding={3} width={300}>
                <Box marginBottom={3}>
                  <Text weight="bold" size="300" align="center">
                    {savedBoardsCount > 0 
                      ? `Saved to ${savedBoardsCount} ${savedBoardsCount === 1 ? 'board' : 'boards'}`
                      : 'Save to board'
                    }
                  </Text>
                  {pinTitle && (
                    <Box marginTop={1}>
                      <Text size="100" color="subtle" align="center" lineClamp={1}>
                        {pinTitle}
                      </Text>
                    </Box>
                  )}
                </Box>

                {boards.length > 5 && (
                  <Box marginBottom={2}>
                    <SearchField
                      id={`compact-save-search-${pinId}`}
                      accessibilityLabel="Search boards"
                      accessibilityClearButtonLabel="Clear"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={({ value }) => setSearchQuery(value)}
                      size="md"
                    />
                  </Box>
                )}

                <Box maxHeight={240} overflow="scrollY">
                  {isBoardsLoading ? (
                    <Box display="flex" justifyContent="center" padding={4}>
                      <Spinner accessibilityLabel="Loading" show size="sm" />
                    </Box>
                  ) : (
                    <Flex direction="column" gap={1}>
                      {filteredBoards.map((board) => (
                        <CompactBoardItem
                          key={board.id}
                          board={board}
                          onSave={() => handleSaveToBoard(board)}
                          onRemove={() => handleRemoveFromBoard(board)}
                          isSaving={savingToBoardId === board.id}
                          isRemoving={removingFromBoardId === board.id}
                        />
                      ))}

                      {filteredBoards.length === 0 && (
                        <Box padding={3}>
                          <Text align="center" color="subtle" size="100">
                            {searchQuery ? 'No boards found' : 'No boards yet'}
                          </Text>
                        </Box>
                      )}
                    </Flex>
                  )}
                </Box>

                <Divider />

                <Box marginTop={2}>
                  <TapArea onTap={handleCreateNew} rounding={2}>
                    <Box
                      padding={2}
                      rounding={2}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="secondary"
                    >
                      <Flex alignItems="center" gap={2}>
                        <Icon accessibilityLabel="" icon="add" size={14} />
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

        {/* Create Board Modal */}
        <BoardCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          pinId={pinId}
        />
      </>
    );
  }

  // Не сохранено - показываем dropdown trigger + Save button
  return (
    <>
      <Flex alignItems="center" gap={1}>
        {/* Board Selector Dropdown Trigger */}
        <Box ref={setAnchorRef}>
          <TapArea onTap={handleDropdownToggle} rounding={2}>
            <Box
              display="flex"
              alignItems="center"
              paddingX={2}
              paddingY={1}
              rounding={2}
              dangerouslySetInlineStyle={{
                __style: {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  maxWidth: 120,
                  cursor: 'pointer',
                },
              }}
            >
              <Flex alignItems="center" gap={1}>
                <Text size="100" weight="bold" lineClamp={1} color="dark">
                  {displayBoardName}
                </Text>
                <Icon
                  accessibilityLabel=""
                  icon="arrow-down"
                  size={10}
                  color="dark"
                />
              </Flex>
            </Box>
          </TapArea>
        </Box>

        {/* Save Button */}
        <TapArea 
          onTap={handleQuickSave} 
          rounding="pill" 
          disabled={isLoading}
          tapStyle="compress"
        >
          <Box
            paddingX={3}
            paddingY={2}
            rounding="pill"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: '#e60023',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'wait' : 'pointer',
                transition: 'all 0.15s ease',
                minWidth: 56,
                display: 'flex',
                justifyContent: 'center',
              },
            }}
          >
            {isLoading ? (
              <Spinner accessibilityLabel="Saving" show size="sm" />
            ) : (
              <Text color="inverse" weight="bold" size="200">
                Save
              </Text>
            )}
          </Box>
        </TapArea>
      </Flex>

      {/* Board Selection Dropdown */}
      {isDropdownOpen && anchorElement && (
        <Layer>
          <Popover
            anchor={anchorElement}
            onDismiss={handleDropdownDismiss}
            idealDirection="down"
            positionRelativeToAnchor={false}
            size="flexible"
            color="white"
          >
            <Box padding={3} width={300}>
              <Box marginBottom={2}>
                <Text weight="bold" size="300" align="center">
                  Save to board
                </Text>
              </Box>

              {boards.length > 5 && (
                <Box marginBottom={2}>
                  <SearchField
                    id={`compact-save-new-search-${pinId}`}
                    accessibilityLabel="Search boards"
                    accessibilityClearButtonLabel="Clear"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={({ value }) => setSearchQuery(value)}
                    size="md"
                  />
                </Box>
              )}

              <Box maxHeight={240} overflow="scrollY">
                {isBoardsLoading ? (
                  <Box display="flex" justifyContent="center" padding={4}>
                    <Spinner accessibilityLabel="Loading" show size="sm" />
                  </Box>
                ) : (
                  <Flex direction="column" gap={1}>
                    {filteredBoards.map((board) => (
                      <CompactBoardItem
                        key={board.id}
                        board={board}
                        onSave={() => handleSaveToBoard(board)}
                        onRemove={() => handleRemoveFromBoard(board)}
                        isSaving={savingToBoardId === board.id}
                        isRemoving={removingFromBoardId === board.id}
                      />
                    ))}

                    {filteredBoards.length === 0 && (
                      <Box padding={3}>
                        <Text align="center" color="subtle" size="100">
                          {searchQuery ? 'No boards found' : 'No boards yet'}
                        </Text>
                      </Box>
                    )}
                  </Flex>
                )}
              </Box>

              <Divider />

              <Box marginTop={2}>
                <TapArea onTap={handleCreateNew} rounding={2}>
                  <Box
                    padding={2}
                    rounding={2}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="secondary"
                  >
                    <Flex alignItems="center" gap={2}>
                      <Icon accessibilityLabel="" icon="add" size={14} />
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

      {/* Create Board Modal */}
      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        pinId={pinId}
      />
    </>
  );
};

export default CompactSaveSection;