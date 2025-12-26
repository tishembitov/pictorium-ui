// src/modules/pin/components/PinSaveSection.tsx

import React, { useCallback, useMemo, useState, useEffect } from 'react';
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
} from 'gestalt';
import { Link } from 'react-router-dom';
import { useAuth, useCurrentUser } from '@/modules/auth';
import { 
  useMyBoardsForPin, 
  useSavePinToBoard,
  useRemovePinFromBoard,
  BoardPicker,
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

// ==================== Profile Icon Styles ====================

const PROFILE_BADGE_STYLE = {
  background: 'linear-gradient(135deg, #e60023 0%, #c7001e 100%)',
  boxShadow: '0 1px 4px rgba(230, 0, 35, 0.25)',
};

// ==================== Sub-components ====================

/**
 * Badge showing where pin is saved - with link to profile or board
 */
const SavedLocationBadge: React.FC<{
  board: BoardWithPinStatusResponse | null;
  isProfile: boolean;
  username?: string;
}> = ({ board, isProfile, username }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Profile link badge
  if (isProfile && username) {
    return (
      <Link 
        to={buildPath.profile(username)} 
        style={{ textDecoration: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          paddingX={3}
          paddingY={2}
          rounding={2}
          display="flex"
          alignItems="center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          dangerouslySetInlineStyle={{
            __style: {
              backgroundColor: isHovered 
                ? 'rgba(230, 0, 35, 0.12)' 
                : 'rgba(230, 0, 35, 0.08)',
              transition: 'background-color 0.15s ease',
            },
          }}
        >
          <Flex alignItems="center" gap={2}>
            {/* Profile icon with red gradient */}
            <Box
              width={24}
              height={24}
              rounding="circle"
              display="flex"
              alignItems="center"
              justifyContent="center"
              dangerouslySetInlineStyle={{
                __style: PROFILE_BADGE_STYLE,
              }}
            >
              <Icon accessibilityLabel="" icon="person" size={12} color="inverse" />
            </Box>
            <Text size="200" weight="bold" color="default">
              Profile
            </Text>
            <Icon accessibilityLabel="" icon="visit" size={12} color="subtle" />
          </Flex>
        </Box>
      </Link>
    );
  }

  // Non-linked profile badge (fallback)
  if (isProfile) {
    return (
      <Box
        paddingX={3}
        paddingY={2}
        rounding={2}
        display="flex"
        alignItems="center"
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: 'rgba(230, 0, 35, 0.08)',
          },
        }}
      >
        <Flex alignItems="center" gap={2}>
          <Box
            width={24}
            height={24}
            rounding="circle"
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: PROFILE_BADGE_STYLE,
            }}
          >
            <Icon accessibilityLabel="" icon="person" size={12} color="inverse" />
          </Box>
          <Text size="200" weight="bold" color="default">
            Profile
          </Text>
        </Flex>
      </Box>
    );
  }

  // Board link badge
  if (!board) return null;

  return (
    <Link 
      to={buildPath.board(board.id)} 
      style={{ textDecoration: 'none' }}
      onClick={(e) => e.stopPropagation()}
    >
      <Box
        paddingX={3}
        paddingY={2}
        rounding={2}
        display="flex"
        alignItems="center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: isHovered ? '#e9e9e9' : '#f0f0f0',
            transition: 'background-color 0.15s ease',
          },
        }}
      >
        <Flex alignItems="center" gap={2}>
          <Icon accessibilityLabel="" icon="board" size={16} color="default" />
          <Text size="200" weight="bold" lineClamp={1}>
            {board.title}
          </Text>
          <Icon accessibilityLabel="" icon="visit" size={12} color="subtle" />
        </Flex>
      </Box>
    </Link>
  );
};

/**
 * Compact saved location link for PinCard overlay
 */
const CompactSavedLocationLink: React.FC<{
  board: BoardWithPinStatusResponse | null;
  isProfile: boolean;
  username?: string;
}> = ({ board, isProfile, username }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Profile link
  if (isProfile && username) {
    return (
      <Link 
        to={buildPath.profile(username)} 
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
              backgroundColor: isHovered 
                ? 'rgba(255,255,255,0.95)' 
                : 'rgba(255,255,255,0.85)',
              transition: 'background-color 0.15s ease',
              maxWidth: 120,
            },
          }}
        >
          <Flex alignItems="center" gap={1}>
            {/* Mini profile icon */}
            <Box
              width={16}
              height={16}
              rounding="circle"
              display="flex"
              alignItems="center"
              justifyContent="center"
              dangerouslySetInlineStyle={{
                __style: {
                  background: 'linear-gradient(135deg, #e60023 0%, #c7001e 100%)',
                },
              }}
            >
              <Icon accessibilityLabel="" icon="person" size={8} color="inverse" />
            </Box>
            <Text size="100" weight="bold" color="dark">
              Profile
            </Text>
          </Flex>
        </Box>
      </Link>
    );
  }

  // Board link
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
            backgroundColor: isHovered 
              ? 'rgba(255,255,255,0.95)' 
              : 'rgba(255,255,255,0.85)',
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
 * Compact Save Section with Dropdown for PinCard overlay
 */
const CompactSaveSection: React.FC<{
  pinId: string;
  boards: BoardWithPinStatusResponse[];
  localSavedToProfile: boolean;
  localSavedBoard: BoardWithPinStatusResponse | null;
  isBoardsLoading: boolean;
  isSaving: boolean;
  username?: string;
  onSaveToBoard: (board: BoardWithPinStatusResponse) => void;
  onSaveToProfile: () => void;
  onUnsave: () => void;
  onCreateSuccess: (boardId: string) => void;
}> = ({
  pinId,
  boards,
  localSavedToProfile,
  localSavedBoard,
  isBoardsLoading,
  isSaving,
  username,
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

  const isSavedAnywhere = localSavedToProfile || !!localSavedBoard;

  // Filter boards
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

  // Already saved - show location link + Saved button
  if (isSavedAnywhere) {
    return (
      <Flex alignItems="center" gap={2}>
        <CompactSavedLocationLink 
          board={localSavedBoard} 
          isProfile={localSavedToProfile && !localSavedBoard}
          username={username}
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

  // Not saved - show Save button with dropdown
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
              {/* Header */}
              <Box marginBottom={3}>
                <Text weight="bold" size="300" align="center">
                  Save to
                </Text>
              </Box>

              {/* Search */}
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

              {/* Options */}
              <Box maxHeight={280} overflow="scrollY">
                {isBoardsLoading ? (
                  <Box display="flex" justifyContent="center" padding={6}>
                    <Spinner accessibilityLabel="Loading boards" show />
                  </Box>
                ) : (
                  <Flex direction="column" gap={1}>
                    {/* Profile Option - First, using ProfileDropdownItem */}
                    <ProfileDropdownItem
                      isSelected={isProfileMode}
                      isSavedToProfile={localSavedToProfile}
                      onSelect={() => {
                        onSaveToProfile();
                        setIsOpen(false);
                      }}
                      isProcessing={isSaving}
                      size="md"
                    />

                    {/* Divider */}
                    {filteredBoards.length > 0 && (
                      <Box paddingY={1}>
                        <Divider />
                      </Box>
                    )}

                    {/* Boards using BoardDropdownItem */}
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

              {/* Create Board */}
              <Box marginTop={3}>
                <Button
                  text="Create board"
                  onClick={() => { 
                    setIsOpen(false); 
                    setShowCreateModal(true); 
                  }}
                  size="lg"
                  color="gray"
                  fullWidth
                  iconEnd="add"
                />
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

// ==================== Main Component ====================

export const PinSaveSection: React.FC<PinSaveSectionProps> = ({
  pinId,
  isSaved,
  isSavedToProfile: propSavedToProfile,
  size = 'md',
  variant = 'default',
}) => {
  const { isAuthenticated, login } = useAuth();
  const { username } = useCurrentUser();
  const { toast } = useToast();

  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);
  const isProfileMode = selectedBoard === null;

  // ==================== Local Optimistic State ====================
  const [localSavedToProfile, setLocalSavedToProfile] = useState(propSavedToProfile);
  const [localSavedBoardId, setLocalSavedBoardId] = useState<string | null>(null);

  // Sync with props
  useEffect(() => {
    setLocalSavedToProfile(propSavedToProfile);
  }, [propSavedToProfile]);

  // ==================== Data Fetching ====================
  const { 
    boards,
    isLoading: isBoardsLoading,
    refetch: refetchBoards,
  } = useMyBoardsForPin(pinId, { enabled: isAuthenticated });

  // Find saved board from API or local state
  const savedBoard = useMemo(() => {
    if (localSavedBoardId) {
      const board = boards.find(b => b.id === localSavedBoardId);
      if (board) return board;
    }
    return boards.find(b => b.hasPin) || null;
  }, [boards, localSavedBoardId]);

  // Sync local board state with API
  useEffect(() => {
    const apiSavedBoard = boards.find(b => b.hasPin);
    if (apiSavedBoard) {
      setLocalSavedBoardId(apiSavedBoard.id);
    } else if (!isSaved) {
      setLocalSavedBoardId(null);
    }
  }, [boards, isSaved]);

  // ==================== Mutations ====================
  const { savePinToBoard, isLoading: isSavingToBoard } = useSavePinToBoard({
    onSuccess: () => {
      void refetchBoards();
    },
    showToast: false,
  });

  const { removePinFromBoard, isLoading: isRemovingFromBoard } = useRemovePinFromBoard({
    showToast: false,
    onSuccess: () => {
      setLocalSavedBoardId(null);
      void refetchBoards();
    },
  });

  const { saveToProfile, isLoading: isSavingToProfile } = useSaveToProfile({
    showToast: false,
  });

  const { unsaveFromProfile, isLoading: isUnsavingFromProfile } = useUnsaveFromProfile({
    showToast: false,
    onSuccess: () => {
      setLocalSavedToProfile(false);
    },
  });

  const isLoading = isSavingToBoard || isRemovingFromBoard || isSavingToProfile || isUnsavingFromProfile;

  // ==================== Handlers ====================
  const handleSaveToProfile = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setLocalSavedToProfile(true);
    setLocalSavedBoardId(null);
    
    saveToProfile(pinId);
    toast.success('Saved to Profile!');
  }, [isAuthenticated, login, pinId, saveToProfile, toast]);

  const handleSaveToBoard = useCallback((board: BoardWithPinStatusResponse) => {
    if (!isAuthenticated) {
      login();
      return;
    }
    if (board.hasPin) return;
    
    setLocalSavedBoardId(board.id);
    setLocalSavedToProfile(false);
    
    savePinToBoard({ boardId: board.id, pinId });
    toast.success(`Saved to "${board.title}"`);
  }, [isAuthenticated, login, savePinToBoard, pinId, toast]);

  const handleUnsave = useCallback(() => {
    if (localSavedToProfile) {
      setLocalSavedToProfile(false);
      unsaveFromProfile(pinId);
      toast.success('Removed from Profile');
    } else if (savedBoard) {
      setLocalSavedBoardId(null);
      removePinFromBoard({ boardId: savedBoard.id, pinId });
      toast.success('Removed from board');
    }
  }, [localSavedToProfile, savedBoard, pinId, unsaveFromProfile, removePinFromBoard, toast]);

  const handleQuickSave = useCallback(() => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (isProfileMode) {
      setLocalSavedToProfile(true);
      saveToProfile(pinId);
      toast.success('Saved to Profile!');
    } else if (selectedBoard) {
      setLocalSavedBoardId(selectedBoard.id);
      savePinToBoard({ boardId: selectedBoard.id, pinId });
      toast.success(`Saved to "${selectedBoard.title}"`);
    }
  }, [isAuthenticated, login, isProfileMode, selectedBoard, pinId, saveToProfile, savePinToBoard, toast]);

  const handleCreateSuccess = useCallback((boardId: string) => {
    setLocalSavedBoardId(boardId);
    savePinToBoard({ boardId, pinId });
    toast.success('Saved to new board!');
  }, [savePinToBoard, pinId, toast]);

  const isSavedAnywhere = localSavedToProfile || !!savedBoard;

  // ==================== Render: Compact Variant ====================
  if (variant === 'compact') {
    return (
      <CompactSaveSection
        pinId={pinId}
        boards={boards}
        localSavedToProfile={localSavedToProfile}
        localSavedBoard={savedBoard}
        isBoardsLoading={isBoardsLoading}
        isSaving={isLoading}
        username={username}
        onSaveToBoard={handleSaveToBoard}
        onSaveToProfile={handleSaveToProfile}
        onUnsave={handleUnsave}
        onCreateSuccess={handleCreateSuccess}
      />
    );
  }

  // ==================== Render: Default Variant ====================
  
  // Already saved
  if (isSavedAnywhere) {
    return (
      <Flex alignItems="center" gap={3}>
        <SavedLocationBadge 
          board={savedBoard} 
          isProfile={localSavedToProfile && !savedBoard}
          username={username}
        />
        <PinSaveButton
          isSaved={true}
          onUnsave={handleUnsave}
          isLoading={isLoading}
          size={size}
        />
      </Flex>
    );
  }

  // Not saved
  return (
    <Flex alignItems="center" gap={3}>
      <BoardPicker
        pinId={pinId}
        onSaveToBoard={handleSaveToBoard}
        onSaveToProfile={handleSaveToProfile}
        isSavedToProfile={localSavedToProfile}
        isSaving={isLoading}
        size={size}
        showLabel
      />
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