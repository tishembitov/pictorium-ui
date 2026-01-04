// src/modules/pin/components/CompactSaveSection.tsx

import React from 'react';
import { Box, Flex, Text, TapArea, Spinner, Icon } from 'gestalt';
import { Link } from 'react-router-dom';
import {
  useBoardSaveManager,
  BoardSaveDropdown,
  BoardCreateModal,
} from '@/modules/board';
import { buildPath } from '@/app/router/routeConfig';
import type { PinLocalState, SavedBoardInfo } from '../hooks/usePinLocalState';

interface CompactSaveSectionProps {
  pinId: string;
  pinTitle?: string | null;
  localState: PinLocalState;
  onSave: (board: SavedBoardInfo) => void;
  onRemove: (boardId: string, remainingBoards?: SavedBoardInfo[]) => void;
}

export const CompactSaveSection: React.FC<CompactSaveSectionProps> = ({
  pinId,
  pinTitle,
  localState,
  onSave,
  onRemove,
}) => {
  const manager = useBoardSaveManager({
    pinId,
    localState,
    onSave,
    onRemove,
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
    displayBoardName,
    savedBoardsCount,
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

  const isLoading = savingToBoardId !== null;

  // Saved state
  if (localState.isSaved && localState.lastSavedBoardId) {
    return (
      <>
        <Flex alignItems="center" gap={1}>
          {/* Board Name */}
          {localState.savedCount === 1 ? (
            <Link
              to={buildPath.board(localState.lastSavedBoardId)}
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
                  {localState.lastSavedBoardName}
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
                      {localState.lastSavedBoardName}
                    </Text>
                    <Text size="100" color="subtle">
                      +{localState.savedCount - 1}
                    </Text>
                  </Flex>
                </Box>
              </TapArea>
            </Box>
          )}

          {/* Saved Button */}
          <Box ref={localState.savedCount === 1 ? setAnchorRef : undefined}>
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
          savedBoardsCount={savedBoardsCount}
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
        savedBoardsCount={savedBoardsCount}
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