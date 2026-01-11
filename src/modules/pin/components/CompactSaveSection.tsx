// src/modules/pin/components/CompactSaveSection.tsx

import React from 'react';
import { Box, Flex, Text, TapArea, Spinner, Icon } from 'gestalt';
import { Link } from 'react-router-dom';
import {
  useBoardSaveManager,
  BoardSaveDropdown,
  BoardCreateModal,
} from '@/modules/board';
import { buildPath } from '@/app/router/routes';
import type { PinLocalState, SavedBoardInfo } from '../hooks/usePinLocalState';
import type { UseBoardSaveManagerResult } from '@/modules/board';

interface CompactSaveSectionProps {
  pinId: string;
  pinTitle?: string | null;
  localState: PinLocalState;
  onSave: (board: SavedBoardInfo) => void;
  onRemove: (boardId: string, remainingBoards?: SavedBoardInfo[]) => void;
}

// ============ Sub-components ============

interface SaveButtonProps {
  isSaved: boolean;
  isLoading: boolean;
  onTap: () => void;
}

const SaveButton: React.FC<SaveButtonProps> = ({ isSaved, isLoading, onTap }) => (
  <TapArea
    onTap={onTap}
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
          backgroundColor: isSaved ? '#111' : '#e60023',
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
          {isSaved ? 'Saved' : 'Save'}
        </Text>
      )}
    </Box>
  </TapArea>
);

interface BoardNameBadgeProps {
  boardId: string;
  boardName: string | null;
  isLink?: boolean;
  extraCount?: number;
  onTap?: () => void;
}

const BoardNameBadge: React.FC<BoardNameBadgeProps> = ({
  boardId,
  boardName,
  isLink = false,
  extraCount,
  onTap,
}) => {
  const content = (
    <Box
      paddingX={2}
      paddingY={1}
      rounding={2}
      dangerouslySetInlineStyle={{
        __style: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          maxWidth: extraCount ? 120 : 100,
          cursor: 'pointer',
        },
      }}
    >
      {extraCount ? (
        <Flex alignItems="center" gap={1}>
          <Text size="100" weight="bold" lineClamp={1} color="dark">
            {boardName}
          </Text>
          <Text size="100" color="subtle">
            +{extraCount}
          </Text>
        </Flex>
      ) : (
        <Text size="100" weight="bold" lineClamp={1} color="dark">
          {boardName}
        </Text>
      )}
    </Box>
  );

  if (isLink) {
    return (
      <Link
        to={buildPath.board(boardId)}
        style={{ textDecoration: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </Link>
    );
  }

  if (onTap) {
    return (
      <TapArea onTap={onTap} rounding={2}>
        {content}
      </TapArea>
    );
  }

  return content;
};

interface BoardSelectorBadgeProps {
  boardName: string;
  onTap: () => void;
}

const BoardSelectorBadge: React.FC<BoardSelectorBadgeProps> = ({ boardName, onTap }) => (
  <TapArea onTap={onTap} rounding={2}>
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
          {boardName}
        </Text>
        <Icon accessibilityLabel="" icon="arrow-down" size={10} color="dark" />
      </Flex>
    </Box>
  </TapArea>
);

// ============ Saved State Component ============

interface SavedStateProps {
  localState: PinLocalState;
  manager: UseBoardSaveManagerResult;
  isLoading: boolean;
  pinTitle?: string | null;
  pinId: string;
}

const SavedState: React.FC<SavedStateProps> = ({
  localState,
  manager,
  isLoading,
  pinTitle,
  pinId,
}) => {
  const {
    isDropdownOpen,
    showCreateModal,
    searchQuery,
    savingToBoardId,
    removingFromBoardId,
    anchorElement,
    filteredBoards,
    isBoardsLoading,
    savedBoardsCount,
    setAnchorRef,
    setSearchQuery,
    handleDropdownToggle,
    handleDropdownDismiss,
    handleSaveToBoard,
    handleRemoveFromBoard,
    handleCreateNew,
    handleCreateSuccess,
    closeCreateModal,
  } = manager;

  const isSingleBoard = localState.savedCount === 1;

  return (
    <>
      <Flex alignItems="center" gap={1}>
        {isSingleBoard ? (
          <BoardNameBadge
            boardId={localState.lastSavedBoardId!}
            boardName={localState.lastSavedBoardName}
            isLink
          />
        ) : (
          <Box ref={setAnchorRef}>
            <BoardNameBadge
              boardId={localState.lastSavedBoardId!}
              boardName={localState.lastSavedBoardName}
              extraCount={localState.savedCount - 1}
              onTap={handleDropdownToggle}
            />
          </Box>
        )}

        <Box ref={isSingleBoard ? setAnchorRef : undefined}>
          <SaveButton
            isSaved
            isLoading={isLoading}
            onTap={handleDropdownToggle}
          />
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
};

// ============ Not Saved State Component ============

interface NotSavedStateProps {
  hasSelectedBoard: boolean;
  manager: UseBoardSaveManagerResult;
  isLoading: boolean;
  pinId: string;
}

const NotSavedState: React.FC<NotSavedStateProps> = ({
  hasSelectedBoard,
  manager,
  isLoading,
  pinId,
}) => {
  const {
    isDropdownOpen,
    showCreateModal,
    searchQuery,
    savingToBoardId,
    removingFromBoardId,
    anchorElement,
    filteredBoards,
    isBoardsLoading,
    savedBoardsCount,
    displayBoardName,
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

  return (
    <>
      <Flex alignItems="center" gap={1}>
        {hasSelectedBoard && (
          <Box ref={setAnchorRef}>
            <BoardSelectorBadge
              boardName={displayBoardName}
              onTap={handleDropdownToggle}
            />
          </Box>
        )}

        <Box ref={hasSelectedBoard ? undefined : setAnchorRef}>
          <SaveButton
            isSaved={false}
            isLoading={isLoading}
            onTap={hasSelectedBoard ? handleQuickSave : handleDropdownToggle}
          />
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

// ============ Main Component ============

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

  const { displayBoardName, savingToBoardId } = manager;
  const isLoading = savingToBoardId !== null;
  const hasSelectedBoard = displayBoardName !== 'Select board';
  const isSaved = localState.isSaved && localState.lastSavedBoardId;

  if (isSaved) {
    return (
      <SavedState
        localState={localState}
        manager={manager}
        isLoading={isLoading}
        pinTitle={pinTitle}
        pinId={pinId}
      />
    );
  }

  return (
    <NotSavedState
      hasSelectedBoard={hasSelectedBoard}
      manager={manager}
      isLoading={isLoading}
      pinId={pinId}
    />
  );
};

export default CompactSaveSection;