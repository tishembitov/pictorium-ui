// src/modules/pin/components/PinSaveSection.tsx

import React, { useCallback, useState, useMemo } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  TapArea, 
  Icon, 
  Popover, 
  Layer, 
  Spinner, 
  SearchField, 
  Divider 
} from 'gestalt';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import { 
  useMyBoardsForPin, 
  useSavePinToBoard,
  useRemovePinFromBoard,
  BoardCreateModal,
  ProfileDropdownItem,
  BoardDropdownItem,
} from '@/modules/board';
import { useSelectedBoardStore } from '@/modules/board/stores/selectedBoardStore';
import { useSaveToProfile } from '../hooks/useSaveToProfile';
import { useUnsaveFromProfile } from '../hooks/useUnsaveFromProfile';
import { buildPath } from '@/app/router/routeConfig';
import { useToast } from '@/shared/hooks/useToast';
import { PinSaveButton } from './PinSaveButton';
import type { BoardWithPinStatusResponse } from '@/modules/board';

interface PinSaveSectionProps {
  pinId: string;
  isSaved: boolean;
  isSavedToProfile: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

/**
 * Ссылка на сохранённую доску/профиль для compact варианта
 */
const SavedLocationLink: React.FC<{
  board: BoardWithPinStatusResponse | null;
  isProfile: boolean;
}> = ({ board, isProfile }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (isProfile) {
    return (
      <Box
        paddingX={2}
        paddingY={1}
        rounding="pill"
        display="flex"
        alignItems="center"
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: 'rgba(255,255,255,0.8)',
            maxWidth: 120,
          },
        }}
      >
        <Flex alignItems="center" gap={1}>
          <Icon accessibilityLabel="" icon="person" size={12} color="dark" />
          <Text size="100" weight="bold" color="dark">
            Profile
          </Text>
        </Flex>
      </Box>
    );
  }

  if (!board) return null;

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
  isSavedToProfile: boolean;
  isBoardsLoading: boolean;
  isSaving: boolean;
  onSaveToBoard: (board: BoardWithPinStatusResponse) => void;
  onSaveToProfile: () => void;
  onUnsave: () => void;
  onCreateSuccess: (boardId: string) => void;
}> = ({
  pinId,
  boards,
  savedBoard,
  isSavedToProfile,
  isBoardsLoading,
  isSaving,
  onSaveToBoard,
  onSaveToProfile,
  onUnsave,
  onCreateSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);

  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  const isProfileMode = selectedBoard === null;

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

  // Определяем текущее состояние сохранения
  const isSavedAnywhere = isSavedToProfile || !!savedBoard;

  // Если пин сохранён - показываем ссылку на место сохранения + кнопку Saved
  if (isSavedAnywhere) {
    return (
      <Flex alignItems="center" gap={2}>
        <SavedLocationLink 
          board={savedBoard || null} 
          isProfile={isSavedToProfile && !savedBoard} 
        />
        
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
                  Save to
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
                    {/* Profile Option - First */}
                    <ProfileDropdownItem
                      isSelected={isProfileMode}
                      isSavedToProfile={isSavedToProfile}
                      onSelect={() => {
                        onSaveToProfile();
                        setIsOpen(false);
                      }}
                      isProcessing={isSaving}
                    />

                    {/* Divider */}
                    {filteredBoards.length > 0 && (
                      <Box paddingY={1}>
                        <Divider />
                      </Box>
                    )}

                    {/* Boards */}
                    {filteredBoards.map((board) => (
                      <BoardDropdownItem
                        key={board.id}
                        board={board}
                        onSelect={(selectedBoard) => {
                          onSaveToBoard(selectedBoard);
                          setIsOpen(false);
                        }}
                        isProcessing={isSaving}
                      />
                    ))}

                    {filteredBoards.length === 0 && searchQuery && (
                      <Box padding={4}>
                        <Text align="center" color="subtle">
                          No boards found
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
  isSaved,
  isSavedToProfile,
  size = 'md',
  variant = 'default',
}) => {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();

  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  const isProfileMode = selectedBoard === null;

  const { 
    boards,
    isLoading: isBoardsLoading,
    refetch: refetchBoards,
  } = useMyBoardsForPin(pinId, { enabled: isAuthenticated });

  const savedBoard = useMemo(() => 
    boards.find(b => b.hasPin), 
    [boards]
  );

  // Board operations
  const { savePinToBoard, isLoading: isSavingToBoard } = useSavePinToBoard({
    onSuccess: () => {
      void refetchBoards();
    },
    showToast: false,
  });

  const { removePinFromBoard, isLoading: isRemovingFromBoard } = useRemovePinFromBoard({
    showToast: false,
    onSuccess: () => {
      void refetchBoards();
    },
  });

  // Profile operations
  const { saveToProfile, isLoading: isSavingToProfile } = useSaveToProfile({
    showToast: false,
  });

  const { unsaveFromProfile, isLoading: isUnsavingFromProfile } = useUnsaveFromProfile({
    showToast: false,
  });

  const isLoading = isSavingToBoard || isRemovingFromBoard || isSavingToProfile || isUnsavingFromProfile;

  // Handlers
  const handleSaveToProfile = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }
    saveToProfile(pinId);
    toast.success('Saved to Profile!');
  }, [isAuthenticated, login, pinId, saveToProfile, toast]);

  const handleSaveToBoard = useCallback((board: BoardWithPinStatusResponse) => {
    if (board.hasPin) return;
    savePinToBoard({ boardId: board.id, pinId });
    toast.success(`Saved to "${board.title}"`);
  }, [savePinToBoard, pinId, toast]);

  const handleUnsave = useCallback(() => {
    // Unsave from where it's saved
    if (isSavedToProfile) {
      unsaveFromProfile(pinId);
      toast.success('Removed from Profile');
    } else if (savedBoard) {
      removePinFromBoard({ boardId: savedBoard.id, pinId });
      toast.success('Removed from board');
    }
  }, [isSavedToProfile, savedBoard, pinId, unsaveFromProfile, removePinFromBoard, toast]);

  const handleQuickSave = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    // Quick save based on selected target
    if (isProfileMode) {
      saveToProfile(pinId);
      toast.success('Saved to Profile!');
    } else if (selectedBoard) {
      savePinToBoard({ boardId: selectedBoard.id, pinId });
      toast.success(`Saved to "${selectedBoard.title}"`);
    }
  }, [isAuthenticated, login, isProfileMode, selectedBoard, pinId, saveToProfile, savePinToBoard, toast]);

  const handleCreateSuccess = useCallback((boardId: string) => {
    savePinToBoard({ boardId, pinId });
    toast.success('Saved to new board!');
  }, [savePinToBoard, pinId, toast]);

  // Определяем сохранён ли пин где-либо
  const isSavedAnywhere = isSavedToProfile || isSaved;

  // Compact variant для PinCard
  if (variant === 'compact') {
    return (
      <CompactSaveSection
        pinId={pinId}
        boards={boards}
        savedBoard={savedBoard}
        isSavedToProfile={isSavedToProfile}
        isBoardsLoading={isBoardsLoading}
        isSaving={isLoading}
        onSaveToBoard={handleSaveToBoard}
        onSaveToProfile={handleSaveToProfile}
        onUnsave={handleUnsave}
        onCreateSuccess={handleCreateSuccess}
      />
    );
  }

  // Default variant - для PinDetailHeader
  if (isSavedAnywhere) {
    return (
      <Flex alignItems="center" gap={3}>
        {isSavedToProfile ? (
          <Box
            paddingX={3}
            paddingY={2}
            rounding={2}
            color="secondary"
            display="flex"
            alignItems="center"
          >
            <Flex alignItems="center" gap={2}>
              <Icon accessibilityLabel="" icon="person" size={16} color="default" />
              <Text weight="bold" size="200">
                Profile
              </Text>
            </Flex>
          </Box>
        ) : savedBoard && (
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
        )}

        <PinSaveButton
          isSaved={true}
          onUnsave={handleUnsave}
          isLoading={isLoading}
          size={size}
        />
      </Flex>
    );
  }

  // Not saved - show picker + save button
  return (
    <Flex alignItems="center" gap={3}>
      {/* Show current target */}
      <Box
        paddingX={3}
        paddingY={2}
        rounding={2}
        color="secondary"
        display="flex"
        alignItems="center"
      >
        <Flex alignItems="center" gap={2}>
          <Icon 
            accessibilityLabel="" 
            icon={isProfileMode ? 'person' : 'board'} 
            size={16} 
            color="default" 
          />
          <Text weight="bold" size="200">
            {isProfileMode ? 'Profile' : selectedBoard?.title}
          </Text>
        </Flex>
      </Box>

      <PinSaveButton
        isSaved={false}
        onSave={handleQuickSave}
        isLoading={isLoading}
        size={size}
      />
    </Flex>
  );
};

export default PinSaveSection;