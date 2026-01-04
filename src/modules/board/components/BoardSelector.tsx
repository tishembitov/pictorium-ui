// src/modules/board/components/BoardSelector.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Box, 
  Flex, 
  Button, 
  Text, 
  Spinner, 
  SearchField,
  TapArea,
  Icon,
  Heading,
} from 'gestalt';
import { BoardCreateModal } from './BoardCreateModal';
import { useMyBoardsForPin } from '../hooks/useMyBoardsForPin';
import { useSavePinToBoard } from '../hooks/useSavePinToBoard';
import { useSelectedBoard } from '../hooks/useSelectedBoard';
import { useSelectBoard } from '../hooks/useSelectBoard';
import { useImageUrl } from '@/modules/storage';
import { useBoardPins } from '../hooks/useBoardPins';
import { useToast } from '@/shared/hooks/useToast';
import type { BoardResponse, BoardWithPinStatusResponse } from '../types/board.types';

interface BoardSelectorProps {
  pinId: string;
  onSave?: (board: BoardResponse) => void;
  onClose?: () => void;
}

// Board item with preview
const BoardSelectorItem: React.FC<{
  board: BoardWithPinStatusResponse;
  isSelected: boolean;
  onSelect: () => void;
  isSaving: boolean;
}> = ({ board, isSelected, onSelect, isSaving }) => {
  const { pins, totalElements: pinCount } = useBoardPins(board.id, { pageable: { page: 0, size: 1 } });
  const coverImageId = pins[0]?.thumbnailId || pins[0]?.imageId;
  const { data: coverData } = useImageUrl(coverImageId, { enabled: !!coverImageId });

  const isDisabled = isSaving || board.hasPin;

  return (
    <TapArea onTap={onSelect} rounding={3} disabled={isDisabled}>
      <Box
        padding={3}
        rounding={3}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'all 0.2s ease',
            backgroundColor: board.hasPin 
              ? 'rgba(0, 128, 0, 0.08)'
              : isSelected 
                ? 'rgba(230, 0, 35, 0.08)' 
                : 'transparent',
            border: isSelected && !board.hasPin ? '2px solid #e60023' : '2px solid transparent',
            opacity: isSaving ? 0.6 : 1,
          },
        }}
      >
        <Flex alignItems="center" gap={3}>
          {/* Board Cover */}
          <Box
            width={56}
            height={56}
            rounding={3}
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
              <Icon accessibilityLabel="" icon="board" size={24} color="subtle" />
            )}
          </Box>

          {/* Board Info */}
          <Flex direction="column" flex="grow" gap={1}>
            <Text weight="bold" size="200" lineClamp={1}>
              {board.title}
            </Text>
            <Flex alignItems="center" gap={2}>
              <Text color="subtle" size="100">
                {pinCount} {pinCount === 1 ? 'pin' : 'pins'}
              </Text>
              {isSelected && !board.hasPin && (
                <>
                  <Text color="subtle" size="100">•</Text>
                  <Text color="success" size="100" weight="bold">
                    Default
                  </Text>
                </>
              )}
            </Flex>
          </Flex>

          {/* Status */}
          {board.hasPin ? (
            <Flex alignItems="center" gap={1}>
              <Icon accessibilityLabel="Saved" icon="check-circle" size={16} color="success" />
              <Text size="100" color="success" weight="bold">
                Saved
              </Text>
            </Flex>
          ) : (
            <Button
              text={isSaving ? '...' : 'Save'}
              size="sm"
              color="red"
              disabled={isSaving}
            />
          )}
        </Flex>
      </Box>
    </TapArea>
  );
};

export const BoardSelector: React.FC<BoardSelectorProps> = ({
  pinId,
  onSave,
  onClose,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingToBoardId, setSavingToBoardId] = useState<string | null>(null);
  const { toast } = useToast();

  const { boards, isLoading, refetch } = useMyBoardsForPin(pinId);
  const { selectedBoard } = useSelectedBoard();
  const { selectBoard } = useSelectBoard();
  
  // ✅ Упрощённый хук
  const { savePinToBoard } = useSavePinToBoard({
    onSuccess: (_, boardId) => {
      setSavingToBoardId(null);
      const board = boards.find(b => b.id === boardId);
      if (board) {
        toast.success(`Saved to "${board.title}"`);
        onSave?.(board);
      }
      onClose?.();
    },
    onError: () => {
      setSavingToBoardId(null);
    },
  });

  const isEmpty = boards.length === 0;

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(board => 
      board.title.toLowerCase().includes(query)
    );
  }, [boards, searchQuery]);

  const handleBoardSelect = useCallback((board: BoardWithPinStatusResponse) => {
    if (board.hasPin) return;
    
    setSavingToBoardId(board.id);
    selectBoard(board.id);
    savePinToBoard({ boardId: board.id, pinId });
  }, [savePinToBoard, pinId, selectBoard]);

  const handleCreateSuccess = useCallback((boardId: string, boardName: string) => {
    selectBoard(boardId);
    setShowCreateModal(false);
    void refetch();
    toast.success(`Created "${boardName}" and saved pin!`);
    onClose?.();
  }, [selectBoard, refetch, toast, onClose]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" padding={6}>
        <Spinner accessibilityLabel="Loading boards" show />
      </Box>
    );
  }

  return (
    <Box>
      <Flex direction="column" gap={3}>
        <Heading size="400" accessibilityLevel={2}>
          Save to board
        </Heading>

        {boards.length > 4 && (
          <SearchField
            id="board-selector-search"
            accessibilityLabel="Search boards"
            accessibilityClearButtonLabel="Clear search"
            placeholder="Search your boards..."
            value={searchQuery}
            onChange={({ value }) => setSearchQuery(value)}
          />
        )}

        <Button
          text="Create new board"
          onClick={() => setShowCreateModal(true)}
          size="lg"
          color="gray"
          fullWidth
          iconEnd="add"
        />

        {isEmpty ? (
          <Box padding={6} color="secondary" rounding={4}>
            <Flex direction="column" alignItems="center" gap={3}>
              <Icon accessibilityLabel="" icon="board" size={48} color="subtle" />
              <Text align="center" color="subtle">
                You don't have any boards yet.
              </Text>
            </Flex>
          </Box>
        ) : (
          <Box maxHeight={300} overflow="scrollY">
            <Flex direction="column" gap={1}>
              {filteredBoards.map((board) => (
                <BoardSelectorItem
                  key={board.id}
                  board={board}
                  isSelected={selectedBoard?.id === board.id}
                  onSelect={() => handleBoardSelect(board)}
                  isSaving={savingToBoardId === board.id}
                />
              ))}
            </Flex>

            {filteredBoards.length === 0 && searchQuery && (
              <Box padding={4}>
                <Text align="center" color="subtle" size="200">
                  No boards matching "{searchQuery}"
                </Text>
              </Box>
            )}
          </Box>
        )}
      </Flex>

      <BoardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
        pinId={pinId}
      />
    </Box>
  );
};

export default BoardSelector;