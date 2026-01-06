// src/modules/board/hooks/useSelectBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { selectedBoardApi } from '../api/selectedBoardApi';
import { useSelectedBoardStore } from '../stores/selectedBoardStore';
import { useToast } from '@/shared/hooks/useToast';
import type { BoardResponse } from '../types/board.types';

interface UseSelectBoardOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export const useSelectBoard = (options: UseSelectBoardOptions = {}) => {
  const { onSuccess, onError, showToast = false } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const setSelectedBoard = useSelectedBoardStore((state) => state.setSelectedBoard);
  const clearSelectedBoard = useSelectedBoardStore((state) => state.clearSelectedBoard);

  const selectMutation = useMutation({
    mutationFn: (boardId: string) => selectedBoardApi.select(boardId),
    onSuccess: (_, boardId) => {
      const board = queryClient.getQueryData<BoardResponse>(
        queryKeys.boards.byId(boardId)
      );
      if (board) {
        setSelectedBoard(board);
      }
      
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.selected() });

      if (showToast) {
        // ✅ Исправлено: используем board.title вместо board.name
        toast.board.selected(board?.title);
      }

      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to select board');
      }
      onError?.(error);
    },
  });

  const deselectMutation = useMutation({
    mutationFn: () => selectedBoardApi.deselect(),
    onSuccess: () => {
      clearSelectedBoard();
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.selected() });

      if (showToast) {
        toast.info('Switched to Profile');
      }

      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to deselect board');
      }
      onError?.(error);
    },
  });

  const switchToProfile = () => {
    deselectMutation.mutate();
  };

  return {
    selectBoard: selectMutation.mutate,
    selectBoardAsync: selectMutation.mutateAsync,
    deselectBoard: deselectMutation.mutate,
    deselectBoardAsync: deselectMutation.mutateAsync,
    switchToProfile,
    isSelecting: selectMutation.isPending,
    isDeselecting: deselectMutation.isPending,
    isLoading: selectMutation.isPending || deselectMutation.isPending,
  };
};

export default useSelectBoard;