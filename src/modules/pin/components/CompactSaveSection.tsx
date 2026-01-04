// src/modules/pin/components/CompactSaveSection.tsx

import React from 'react';
import { Box, Flex, Text, TapArea, Spinner, Icon } from 'gestalt';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth';
import {
  useBoardSaveManager,
  BoardSaveDropdown,
  BoardCreateModal,
} from '@/modules/board';
import { buildPath } from '@/app/router/routeConfig';

interface CompactSaveSectionProps {
  pinId: string;
  pinTitle?: string | null;
  lastSavedBoardId: string | null;
  lastSavedBoardName: string | null;
  savedToBoardsCount: number;
}

export const CompactSaveSection: React.FC<CompactSaveSectionProps> = ({
  pinId,
  pinTitle,
  lastSavedBoardId,
  lastSavedBoardName,
  savedToBoardsCount,
}) => {
  useAuth();

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

  // Saved state
  if (isSaved && currentSaveInfo) {
    return (
      <>
        <Flex alignItems="center" gap={1}>
          {/* Board Name */}
          {currentCount === 1 ? (
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

          {/* Saved Button */}
          <Box ref={currentCount === 1 ? setAnchorRef : undefined}>
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
          size="sm"
        />

        <BoardCreateModal
          isOpen={showCreateModal}
          onClose={closeCreateModal}
          onSuccess={handleCreateSuccess}
          pinId={pinId}
        />
      </>
    );
  }

  // Not saved state
  return (
    <>
      <Flex alignItems="center" gap={1}>
        {/* Board Selector Trigger */}
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
                <Icon accessibilityLabel="" icon="arrow-down" size={10} color="dark" />
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
        size="sm"
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

export default CompactSaveSection;