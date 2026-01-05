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
  autoSelect?: boolean;
}

export const useCreateBoardWithPin = (
  pinId: string,
  options: UseCreateBoardWithPinOptions = {}
) => {
  const { 
    onSuccess, 
    onError, 
    autoSelect = true,
  } = options;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectBoard } = useSelectBoard();

  const mutation = useMutation({
    mutationFn: (data: BoardCreateRequest) => 
      boardApi.createWithPin(pinId, data),

    onSuccess: (board) => {
      // Board-related
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });

      // ✅ Pin lists (пин теперь сохранён)
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });

      if (autoSelect) {
        selectBoard(board.id);
      }

      toast.success(`Created "${board.title}" and saved pin!`);
      onSuccess?.(board);
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create board');
      onError?.(error);
    },
  });

  return {
    createBoardWithPin: mutation.mutate,
    createBoardWithPinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export default useCreateBoardWithPin;