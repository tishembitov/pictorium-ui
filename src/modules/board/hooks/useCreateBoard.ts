// src/modules/board/hooks/useCreateBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import type { BoardCreateRequest, BoardResponse } from '../types/board.types';

interface UseCreateBoardOptions {
  onSuccess?: (data: BoardResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Hook to create a new board
 */
export const useCreateBoard = (options: UseCreateBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: BoardCreateRequest) => boardApi.create(data),
    onSuccess: (data) => {
      // Invalidate boards lists
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });

      if (showToast) {
        toast.success(SUCCESS_MESSAGES.BOARD_CREATED);
      }

      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to create board');
      }

      onError?.(error);
    },
  });

  return {
    createBoard: mutation.mutate,
    createBoardAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export default useCreateBoard;