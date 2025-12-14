// src/modules/board/hooks/useRemovePinFromBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import type { BoardPinAction } from '../types/board.types';

interface UseRemovePinFromBoardOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Hook to remove a pin from a board
 */
export const useRemovePinFromBoard = (options: UseRemovePinFromBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: ({ boardId, pinId }: BoardPinAction) =>
      boardApi.removePin(boardId, pinId),
    onSuccess: (_, variables) => {
      // Invalidate board pins
      queryClient.invalidateQueries({
        queryKey: queryKeys.boards.pins(variables.boardId),
      });

      if (showToast) {
        toast.success('Pin removed from board');
      }

      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to remove pin from board');
      }

      onError?.(error);
    },
  });

  return {
    removePinFromBoard: mutation.mutate,
    removePinFromBoardAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useRemovePinFromBoard;