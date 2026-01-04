// src/modules/board/hooks/useCreateBoardWithPin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { useSelectBoard } from './useSelectBoard';
import type { BoardCreateRequest, BoardResponse } from '../types/board.types';

interface UseCreateBoardWithPinOptions {
  onSuccess?: (board: BoardResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  autoSelect?: boolean;
}

/**
 * Hook to create a new board and save a pin to it in one request
 * Uses POST /api/v1/boards/with-pin/{pinId}
 */
export const useCreateBoardWithPin = (
  pinId: string,
  options: UseCreateBoardWithPinOptions = {}
) => {
  const { 
    onSuccess, 
    onError, 
    showToast = true,
    autoSelect = true,
  } = options;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectBoard } = useSelectBoard();

  const mutation = useMutation({
    mutationFn: (data: BoardCreateRequest) => 
      boardApi.createWithPin(pinId, data),

    onSuccess: (board) => {
      // Add to my boards cache
      queryClient.setQueryData<BoardResponse[]>(
        queryKeys.boards.my(),
        (oldData) => oldData ? [board, ...oldData] : [board]
      );
      
      // Set individual board cache
      queryClient.setQueryData(queryKeys.boards.byId(board.id), board);
      
      // Invalidate related queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.pins.byId(pinId) });

      // Auto-select the new board
      if (autoSelect) {
        selectBoard(board.id);
      }

      if (showToast) {
        toast.success(`Created "${board.title}" and saved pin!`);
      }

      onSuccess?.(board);
    },

    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to create board');
      }
      onError?.(error);
    },
  });

  return {
    createBoardWithPin: mutation.mutate,
    createBoardWithPinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export default useCreateBoardWithPin;