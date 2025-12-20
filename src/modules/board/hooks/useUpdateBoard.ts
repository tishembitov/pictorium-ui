// src/modules/board/hooks/useUpdateBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import type { BoardResponse, BoardUpdateRequest } from '../types/board.types';

interface UseUpdateBoardOptions {
  onSuccess?: (data: BoardResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export const useUpdateBoard = (options: UseUpdateBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: ({ boardId, data }: { boardId: string; data: BoardUpdateRequest }) =>
      boardApi.update(boardId, data),
    onSuccess: (data, variables) => {
      // Update board in cache
      queryClient.setQueryData(queryKeys.boards.byId(variables.boardId), data);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });

      if (showToast) {
        toast.success('Board updated!');
      }

      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to update board');
      }
      onError?.(error);
    },
  });

  return {
    updateBoard: mutation.mutate,
    updateBoardAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useUpdateBoard;