// src/modules/board/components/BoardPicker.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Dropdown, IconButton, Tooltip } from 'gestalt';
import { useMyBoards } from '../hooks/useMyBoards';
import { useSelectedBoard } from '../hooks/useSelectedBoard';
import { useSelectBoard } from '../hooks/useSelectBoard';
import { BoardCreateModal } from './BoardCreateModal';
import type { BoardResponse } from '../types/board.types';

interface BoardPickerProps {
  onBoardChange?: (board: BoardResponse | null) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const BoardPicker: React.FC<BoardPickerProps> = ({
  onBoardChange,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { boards } = useMyBoards();
  const { selectedBoard } = useSelectedBoard();
  const { selectBoard, deselectBoard } = useSelectBoard();

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleBoardSelect = useCallback(
    (board: BoardResponse) => {
      selectBoard(board.id);
      onBoardChange?.(board);
      setIsOpen(false);
    },
    [selectBoard, onBoardChange]
  );

  const handleDeselect = useCallback(() => {
    deselectBoard();
    onBoardChange?.(null);
    setIsOpen(false);
  }, [deselectBoard, onBoardChange]);

  const handleCreateNew = useCallback(() => {
    setIsOpen(false);
    setShowCreateModal(true);
  }, []);

  const handleCreateSuccess = useCallback(
    (boardId: string) => {
      selectBoard(boardId);
      setShowCreateModal(false);
    },
    [selectBoard]
  );

  const setAnchorRef = useCallback((node: HTMLButtonElement | null) => {
    setAnchorElement(node);
  }, []);

  // Вычисляем размер иконки отдельно для избежания вложенных тернарников
  const iconSize = useMemo((): 'xs' | 'md' | 'lg' => {
    if (size === 'sm') return 'xs';
    if (size === 'lg') return 'lg';
    return 'md';
  }, [size]);

  // Вычисляем цвет фона
  const bgColor = selectedBoard ? 'red' : 'transparent';
  const iconColor = selectedBoard ? 'white' : 'darkGray';

  return (
    <>
      <Tooltip text={selectedBoard ? selectedBoard.title : 'Select board'}>
        <IconButton
          ref={setAnchorRef}
          accessibilityLabel="Select board"
          accessibilityExpanded={isOpen}
          accessibilityHaspopup
          icon="board"
          onClick={handleToggle}
          size={iconSize}
          bgColor={bgColor}
          iconColor={iconColor}
        />
      </Tooltip>

      {isOpen && anchorElement && (
        <Dropdown
          anchor={anchorElement}
          id="board-picker-dropdown"
          onDismiss={handleDismiss}
        >
          <Dropdown.Section label="Save to board">
            {/* Create new */}
            <Dropdown.Item
              onSelect={handleCreateNew}
              option={{ value: 'create', label: 'Create new board' }}
            />

            {/* Deselect option */}
            {selectedBoard && (
              <Dropdown.Item
                onSelect={handleDeselect}
                option={{ value: 'none', label: 'No board selected' }}
              />
            )}

            {/* Board list */}
            {boards.map((board) => {
              const isSelected = selectedBoard?.id === board.id;
              return (
                <Dropdown.Item
                  key={board.id}
                  onSelect={() => handleBoardSelect(board)}
                  option={{ value: board.id, label: board.title }}
                  selected={isSelected ? { value: board.id, label: board.title } : undefined}
                />
              );
            })}
          </Dropdown.Section>
        </Dropdown>
      )}

      {/* Create board modal */}
      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default BoardPicker;