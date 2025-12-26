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
import { useMyBoardsForPin } from '../hooks/useMyBoardsForPin';
import { useSelectedBoard } from '../hooks/useSelectedBoard';
import { useSelectBoard } from '../hooks/useSelectBoard';
import { BoardCreateModal } from './BoardCreateModal';
import { useBoardPins } from '../hooks/useBoardPins';
import { useImageUrl } from '@/modules/storage';
import type { BoardResponse, BoardWithPinStatusResponse } from '../types/board.types';

// ==================== Types ====================

interface BoardPickerProps {
  pinId?: string;
  onBoardChange?: (board: BoardResponse | null) => void;
  onSaveToBoard?: (board: BoardWithPinStatusResponse) => void;
  onSaveToProfile?: () => void;
  isSavedToProfile?: boolean;
  isSaving?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

type PickerSize = 'sm' | 'md' | 'lg';
type GestaltPadding = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// ==================== Profile Icon Styles ====================

interface IconStyle {
  background: string;
  boxShadow: string;
}

const ICON_STYLE_DEFAULT: IconStyle = {
  background: 'linear-gradient(135deg, #e60023 0%, #c7001e 100%)',
  boxShadow: '0 2px 8px rgba(230, 0, 35, 0.3)',
};

const ICON_STYLE_HOVER: IconStyle = {
  background: 'linear-gradient(135deg, #ff1a3d 0%, #e60023 100%)',
  boxShadow: '0 4px 12px rgba(230, 0, 35, 0.4)',
};

const ICON_STYLE_SAVED: IconStyle = {
  background: 'linear-gradient(135deg, #0a7c42 0%, #059669 100%)',
  boxShadow: '0 2px 8px rgba(10, 124, 66, 0.3)',
};

const getProfileIconStyle = (isSaved: boolean, isHovered: boolean): IconStyle => {
  if (isSaved) return ICON_STYLE_SAVED;
  if (isHovered) return ICON_STYLE_HOVER;
  return ICON_STYLE_DEFAULT;
};

// ==================== Shared Helpers ====================

/**
 * Returns background color for picker items based on state.
 * Used by both ProfilePickerItem and BoardPickerItem.
 */
const getPickerItemBackgroundColor = (
  isSelected: boolean,
  isHovered: boolean,
  isDisabled: boolean
): string => {
  if (isSelected) {
    return 'rgba(230, 0, 35, 0.08)';
  }
  if (isHovered && !isDisabled) {
    return '#f5f5f5';
  }
  return 'transparent';
};

// ==================== Sub-components ====================

// Profile picker item with red theme
const ProfilePickerItem: React.FC<{
  isSelected: boolean;
  isSavedToProfile: boolean;
  onSelect: () => void;
  isProcessing?: boolean;
}> = ({ isSelected, isSavedToProfile, onSelect, isProcessing = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const isDisabled = isProcessing;
  const iconStyle = getProfileIconStyle(isSavedToProfile, isHovered);
  const backgroundColor = getPickerItemBackgroundColor(isSelected, isHovered, isDisabled);

  return (
    <TapArea onTap={() => !isDisabled && onSelect()} rounding={3} disabled={isDisabled}>
      <Box
        paddingY={2}
        paddingX={2}
        rounding={3}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'all 0.15s ease',
            border: isSelected ? '2px solid #e60023' : '2px solid transparent',
            backgroundColor,
            opacity: isDisabled ? 0.7 : 1,
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Profile Icon with Red Gradient */}
          <Box
            width={40}
            height={40}
            rounding={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: {
                ...iconStyle,
                transition: 'all 0.15s ease',
              },
            }}
          >
            <Icon accessibilityLabel="" icon="person" size={18} color="inverse" />
          </Box>

          {/* Title */}
          <Box flex="grow">
            <Text weight={isSelected ? 'bold' : 'normal'} size="200">
              Profile
            </Text>
            <Text color="subtle" size="100">
              {isSavedToProfile ? 'Already saved' : 'Save without board'}
            </Text>
          </Box>

          {/* Status */}
          {isProcessing && (
            <Spinner accessibilityLabel="Saving" show size="sm" />
          )}
          {isSavedToProfile && !isProcessing && (
            <Box
              rounding="circle"
              padding={1}
              dangerouslySetInlineStyle={{
                __style: { backgroundColor: 'rgba(10, 124, 66, 0.1)' },
              }}
            >
              <Icon accessibilityLabel="Saved" icon="check-circle" size={20} color="success" />
            </Box>
          )}
          {isSelected && !isSavedToProfile && !isProcessing && (
            <Box color="primary" rounding="pill" paddingX={2} paddingY={1}>
              <Text size="100" color="inverse" weight="bold">
                Default
              </Text>
            </Box>
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

// Board item for picker
const BoardPickerItem: React.FC<{
  board: BoardWithPinStatusResponse | BoardResponse;
  isSelected: boolean;
  onSelect: () => void;
  isProcessing?: boolean;
}> = ({ board, isSelected, onSelect, isProcessing = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const { pins } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  // Check if this is a BoardWithPinStatusResponse
  const hasPin = 'hasPin' in board ? board.hasPin : false;
  const pinCount = 'pinCount' in board ? board.pinCount : pins.length;
  
  const isDisabled = isProcessing || hasPin;
  const backgroundColor = getPickerItemBackgroundColor(isSelected, isHovered, isDisabled);

  return (
    <TapArea onTap={() => !isDisabled && onSelect()} rounding={3} disabled={isDisabled}>
      <Box
        paddingY={2}
        paddingX={2}
        rounding={3}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'all 0.15s ease',
            border: isSelected ? '2px solid #e60023' : '2px solid transparent',
            backgroundColor,
            opacity: isDisabled ? 0.7 : 1,
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Mini Cover */}
          <Box
            width={40}
            height={40}
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
              } : {
                background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
              },
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
            <Text color="subtle" size="100">
              {pinCount} {pinCount === 1 ? 'pin' : 'pins'}
            </Text>
          </Box>

          {/* Status */}
          {isProcessing && (
            <Spinner accessibilityLabel="Saving" show size="sm" />
          )}
          {hasPin && !isProcessing && (
            <Box
              rounding="circle"
              padding={1}
              dangerouslySetInlineStyle={{
                __style: { backgroundColor: 'rgba(10, 124, 66, 0.1)' },
              }}
            >
              <Icon accessibilityLabel="Saved" icon="check-circle" size={20} color="success" />
            </Box>
          )}
          {isSelected && !hasPin && !isProcessing && (
            <Icon accessibilityLabel="Selected" icon="check" size={16} color="success" />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

// ==================== Helper: Get size values ====================

interface SizeValues {
  paddingX: GestaltPadding;
  paddingY: GestaltPadding;
  iconSize: 14 | 16 | 20;
}

const getSizeValues = (size: PickerSize): SizeValues => {
  const sizeMap: Record<PickerSize, SizeValues> = {
    sm: { paddingX: 2, paddingY: 1, iconSize: 14 },
    md: { paddingX: 3, paddingY: 2, iconSize: 16 },
    lg: { paddingX: 3, paddingY: 2, iconSize: 20 },
  };
  return sizeMap[size];
};

// ==================== Main Component ====================

export const BoardPicker: React.FC<BoardPickerProps> = ({
  pinId,
  onBoardChange,
  onSaveToBoard,
  onSaveToProfile,
  isSavedToProfile = false,
  isSaving = false,
  size = 'md',
  showLabel = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);

  // Use different hooks based on whether we have a pinId
  const { boards: simpleBoards, isLoading: isLoadingSimple } = useMyBoards({ 
    enabled: !pinId 
  });
  const { boards: boardsWithStatus, isLoading: isLoadingWithStatus } = useMyBoardsForPin(pinId, { 
    enabled: !!pinId 
  });

  const boards = pinId ? boardsWithStatus : simpleBoards;
  const isBoardsLoading = pinId ? isLoadingWithStatus : isLoadingSimple;

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
    if (onSaveToProfile) {
      onSaveToProfile();
    } else {
      switchToProfile();
      onBoardChange?.(null);
    }
    setIsOpen(false);
  }, [switchToProfile, onBoardChange, onSaveToProfile]);

  const handleBoardSelect = useCallback((board: BoardResponse | BoardWithPinStatusResponse) => {
    if (onSaveToBoard && 'hasPin' in board) {
      onSaveToBoard(board);
    } else {
      selectBoard(board.id);
      onBoardChange?.(board);
    }
    setIsOpen(false);
  }, [selectBoard, onBoardChange, onSaveToBoard]);

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

  // Size-based styling
  const { paddingX, paddingY, iconSize } = getSizeValues(size);

  // Display info
  const displayText = isProfileMode ? 'Profile' : selectedBoard?.title;

  // Trigger icon size for profile
  const triggerIconContainerSize = iconSize + 6;
  const triggerIconInnerSize = (iconSize - 2) as 12 | 14 | 18;

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
                {/* Icon with Red Gradient for Profile */}
                {isProfileMode ? (
                  <Box
                    width={triggerIconContainerSize}
                    height={triggerIconContainerSize}
                    rounding="circle"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    dangerouslySetInlineStyle={{
                      __style: {
                        background: 'linear-gradient(135deg, #e60023 0%, #c7001e 100%)',
                        boxShadow: '0 1px 4px rgba(230, 0, 35, 0.3)',
                      },
                    }}
                  >
                    <Icon 
                      accessibilityLabel="" 
                      icon="person" 
                      size={triggerIconInnerSize} 
                      color="inverse" 
                    />
                  </Box>
                ) : (
                  <Icon 
                    accessibilityLabel="" 
                    icon="board" 
                    size={iconSize} 
                    color="default" 
                  />
                )}
                
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
            <Box padding={3} width={300}>
              {/* Header */}
              <Box marginBottom={3}>
                <Text weight="bold" size="300" align="center">
                  {pinId ? 'Save to' : 'Choose save location'}
                </Text>
              </Box>

              {/* Search - only if many boards */}
              {boards.length > 5 && (
                <Box marginBottom={3}>
                  <SearchField
                    id="board-picker-search"
                    accessibilityLabel="Search boards"
                    accessibilityClearButtonLabel="Clear"
                    placeholder="Search boards..."
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
                  <Box display="flex" justifyContent="center" padding={4}>
                    <Spinner accessibilityLabel="Loading boards" show size="sm" />
                  </Box>
                ) : (
                  <Box maxHeight={280} overflow="scrollY">
                    <Flex direction="column" gap={1}>
                      {/* Profile Option - Always First */}
                      <ProfilePickerItem
                        isSelected={isProfileMode}
                        isSavedToProfile={isSavedToProfile}
                        onSelect={handleProfileSelect}
                        isProcessing={isSaving}
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
                          isProcessing={isSaving}
                        />
                      ))}

                      {/* No results */}
                      {filteredBoards.length === 0 && searchQuery && (
                        <Box padding={4}>
                          <Text align="center" color="subtle" size="200">
                            No boards found
                          </Text>
                        </Box>
                      )}

                      {/* Empty state */}
                      {filteredBoards.length === 0 && !searchQuery && (
                        <Box padding={4}>
                          <Text align="center" color="subtle" size="200">
                            No boards yet. Create your first!
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