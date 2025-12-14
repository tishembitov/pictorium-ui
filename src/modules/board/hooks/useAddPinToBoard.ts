// src/modules/board/hooks/useAddPinToBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import type { BoardPinAction } from '../types/board.types';

interface UseAddPinToBoardOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Hook to add a pin to a board
 */
export const useAddPinToBoard = (options: UseAddPinToBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: ({ boardId, pinId }: BoardPinAction) =>
      boardApi.addPin(boardId, pinId),
    onSuccess: (_, variables) => {
      // Invalidate board pins
      queryClient.invalidateQueries({
        queryKey: queryKeys.boards.pins(variables.boardId),
      });

      if (showToast) {
        toast.success(SUCCESS_MESSAGES.PIN_SAVED);
      }

      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to add pin to board');
      }

      onError?.(error);
    },
  });

  return {
    addPinToBoard: mutation.mutate,
    addPinToBoardAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useAddPinToBoard;