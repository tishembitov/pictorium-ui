// src/modules/pin/components/PinSaveSection.tsx

import React, { useMemo } from 'react';
import { Box, Flex, Text, TapArea, Spinner, Icon } from 'gestalt';
import { Link } from 'react-router-dom';
import {
  useBoardSaveManager,
  BoardSaveDropdown,
  BoardCreateModal,
} from '@/modules/board';
import { buildPath } from '@/app/router/routes';
import type { PinLocalState, SavedBoardInfo } from '../hooks/usePinLocalState';

interface PinSaveSectionProps {
  pinId: string;
  pinTitle?: string | null;
  localState: PinLocalState;
  onSave: (board: SavedBoardInfo) => void;
  onRemove: (boardId: string, remainingBoards?: SavedBoardInfo[]) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const PinSaveSection: React.FC<PinSaveSectionProps> = ({
  pinId,
  pinTitle,
  localState,
  onSave,
  onRemove,
  size = 'md',
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

  // ✅ Проверяем есть ли выбранная доска
  const hasSelectedBoard = displayBoardName !== 'Select board';

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

  // ✅ Рендер названия доски - только если есть что показать
  const renderBoardName = () => {
    // Если сохранено - показываем ссылку на доску
    if (localState.isSaved && localState.lastSavedBoardId) {
      if (localState.savedCount === 1) {
        return (
          <Link 
            to={buildPath.board(localState.lastSavedBoardId)} 
            style={{ textDecoration: 'none' }}
          >
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
                  {localState.lastSavedBoardName}
                </Text>
              </Flex>
            </Box>
          </Link>
        );
      }

      // Несколько досок - показываем dropdown
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
                  {localState.lastSavedBoardName}
                </Text>
                <Box rounding="pill" paddingX={2} color="secondary">
                  <Text size="100" weight="bold">
                    +{localState.savedCount - 1}
                  </Text>
                </Box>
              </Flex>
            </Box>
          </TapArea>
        </Box>
      );
    }

    // ✅ Не сохранено и есть selectedBoard - показываем selector
    if (hasSelectedBoard) {
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
    }

    // ✅ Не сохранено и НЕТ selectedBoard - ничего не показываем
    return null;
  };

  return (
    <>
      <Flex alignItems="center" gap={2}>
        {renderBoardName()}

        {/* Save/Saved Button */}
        <Box ref={
          // Anchor для dropdown если:
          // 1. Сохранено в одну доску
          // 2. Нет selectedBoard (кнопка Save открывает picker)
          (localState.isSaved && localState.savedCount === 1) || !hasSelectedBoard 
            ? setAnchorRef 
            : undefined
        }>
          <TapArea
            onTap={hasSelectedBoard ? handleQuickSave : handleDropdownToggle}
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
                  backgroundColor: localState.isSaved ? '#111' : '#e60023',
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
                  {localState.isSaved ? 'Saved' : 'Save'}
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