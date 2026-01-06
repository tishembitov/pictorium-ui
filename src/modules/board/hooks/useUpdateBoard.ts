// src/modules/board/hooks/useUpdateBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import type { BoardResponse, BoardUpdateRequest } from '../types/board.types';

interface UseUpdateBoardOptions {
  onSuccess?: (data: BoardResponse) => void;
  onError?: (error: Error) => void;
}

export const useUpdateBoard = (options: UseUpdateBoardOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: ({ boardId, data }: { boardId: string; data: BoardUpdateRequest }) =>
      boardApi.update(boardId, data),
      
    onSuccess: (data, variables) => {
      // Обновляем кэш этой доски
      queryClient.setQueryData(queryKeys.boards.byId(variables.boardId), data);
      
      // Инвалидируем списки
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.boards.my(),
        refetchType: 'none',
      });

      toast.board.created(data?.name); // Или toast.board.updated() если нужен новый пресет
      onSuccess?.(data);
    },
    
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update board'); // Можно заменить на пресет, если потребуется
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