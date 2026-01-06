// src/modules/board/hooks/useCreateBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import type { BoardCreateRequest, BoardResponse } from '../types/board.types';

interface UseCreateBoardOptions {
  onSuccess?: (data: BoardResponse) => void;
  onError?: (error: Error) => void;
}

export const useCreateBoard = (options: UseCreateBoardOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: BoardCreateRequest) => boardApi.create(data),
    
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });

      // ✅ Исправлено: используем data.title вместо data.name
      toast.board.created(data?.title);
      onSuccess?.(data);
    },
    
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create board');
      onError?.(error);
    },
  });

  return {
    createBoard: mutation.mutate,
    createBoardAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export default useCreateBoard;