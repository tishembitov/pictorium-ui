// src/modules/pin/components/PinSaveSection.tsx

import React, { useMemo } from 'react';
import { Box, Flex, Text, TapArea, Spinner, Icon } from 'gestalt';
import { Link } from 'react-router-dom';
import {
  useBoardSaveManager,
  BoardSaveDropdown,
  BoardCreateModal,
} from '@/modules/board';
import { buildPath } from '@/app/router/routeConfig';

interface PinSaveSectionProps {
  pinId: string;
  pinTitle?: string | null;
  lastSavedBoardId: string | null;
  lastSavedBoardName: string | null;
  savedToBoardsCount: number;
  size?: 'sm' | 'md' | 'lg';
}

export const PinSaveSection: React.FC<PinSaveSectionProps> = ({
  pinId,
  pinTitle,
  lastSavedBoardId,
  lastSavedBoardName,
  savedToBoardsCount,
  size = 'md',
}) => {
  const manager = useBoardSaveManager({
    pinId,
    lastSavedBoardId,
    lastSavedBoardName,
    savedToBoardsCount,
  });

  const {
    isDropdownOpen,
    showCreateModal,
    searchQuery,
    savingToBoardId,
    removingFromBoardId,
    anchorElement,
    filteredBoards,
    isBoardsLoading,
    isSaved,
    currentSaveInfo,
    displayBoardName,
    currentCount,
    savedBoardsCount: savedCount,
    isLoading,
    setAnchorRef,
    setSearchQuery,
    handleDropdownToggle,
    handleDropdownDismiss,
    handleQuickSave,
    handleSaveToBoard,
    handleRemoveFromBoard,
    handleCreateNew,
    handleCreateSuccess,
    closeCreateModal,
  } = manager;

  const dimensions = useMemo(() => {
    switch (size) {
      case 'sm':
        return { buttonHeight: 36, fontSize: '200' as const };
      case 'lg':
        return { buttonHeight: 48, fontSize: '300' as const };
      default:
        return { buttonHeight: 40, fontSize: '200' as const };
    }
  }, [size]);

  const renderBoardName = () => {
    if (isSaved && currentSaveInfo) {
      if (currentCount === 1) {
        return (
          <Link to={buildPath.board(currentSaveInfo.boardId)} style={{ textDecoration: 'none' }}>
            <Box
              display="flex"
              alignItems="center"
              paddingX={3}
              rounding={2}
              dangerouslySetInlineStyle={{
                __style: {
                  height: dimensions.buttonHeight,
                  backgroundColor: 'rgba(0, 0, 0, 0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                },
              }}
            >
              <Flex alignItems="center" gap={2}>
                <Icon accessibilityLabel="" icon="board" size={16} color="default" />
                <Text weight="bold" size={dimensions.fontSize} lineClamp={1}>
                  {displayBoardName}
                </Text>
              </Flex>
            </Box>
          </Link>
        );
      }

      return (
        <Box ref={setAnchorRef}>
          <TapArea onTap={handleDropdownToggle} rounding={2}>
            <Box
              display="flex"
              alignItems="center"
              paddingX={3}
              rounding={2}
              dangerouslySetInlineStyle={{
                __style: {
                  height: dimensions.buttonHeight,
                  backgroundColor: 'rgba(0, 0, 0, 0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                },
              }}
            >
              <Flex alignItems="center" gap={2}>
                <Icon accessibilityLabel="" icon="board" size={16} color="default" />
                <Text weight="bold" size={dimensions.fontSize} lineClamp={1}>
                  {displayBoardName}
                </Text>
                <Box rounding="pill" paddingX={2} color="secondary">
                  <Text size="100" weight="bold">
                    +{currentCount - 1}
                  </Text>
                </Box>
              </Flex>
            </Box>
          </TapArea>
        </Box>
      );
    }

    return (
      <Box ref={setAnchorRef}>
        <TapArea onTap={handleDropdownToggle} rounding={2}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="between"
            paddingX={3}
            rounding={2}
            dangerouslySetInlineStyle={{
              __style: {
                height: dimensions.buttonHeight,
                minWidth: 140,
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              },
            }}
          >
            <Flex alignItems="center" gap={2} flex="grow">
              <Text weight="bold" size={dimensions.fontSize} lineClamp={1}>
                {displayBoardName}
              </Text>
            </Flex>
            <Icon
              accessibilityLabel=""
              icon={isDropdownOpen ? 'arrow-up' : 'arrow-down'}
              size={12}
              color="default"
            />
          </Box>
        </TapArea>
      </Box>
    );
  };

  return (
    <>
      <Flex alignItems="center" gap={2}>
        {renderBoardName()}

        {/* Save/Saved Button */}
        <Box ref={isSaved && currentCount === 1 ? setAnchorRef : undefined}>
          <TapArea
            onTap={handleQuickSave}
            rounding={2}
            disabled={isLoading}
            tapStyle="compress"
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              paddingX={4}
              rounding={2}
              dangerouslySetInlineStyle={{
                __style: {
                  height: dimensions.buttonHeight,
                  minWidth: 80,
                  backgroundColor: isSaved ? '#111' : '#e60023',
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease',
                },
              }}
            >
              {isLoading ? (
                <Spinner accessibilityLabel="Saving" show size="sm" />
              ) : (
                <Text color="inverse" weight="bold" size={dimensions.fontSize}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              )}
            </Box>
          </TapArea>
        </Box>
      </Flex>

      <BoardSaveDropdown
        isOpen={isDropdownOpen}
        anchorElement={anchorElement}
        onDismiss={handleDropdownDismiss}
        boards={filteredBoards}
        isLoading={isBoardsLoading}
        savedBoardsCount={savedCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        savingToBoardId={savingToBoardId}
        removingFromBoardId={removingFromBoardId}
        onSaveToBoard={handleSaveToBoard}
        onRemoveFromBoard={handleRemoveFromBoard}
        onCreateNew={handleCreateNew}
        pinTitle={pinTitle}
        size="md"
      />

      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        onSuccess={handleCreateSuccess}
        pinId={pinId}
      />
    </>
  );
};

export default PinSaveSection;