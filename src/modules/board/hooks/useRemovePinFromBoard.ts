// src/modules/board/hooks/useRemovePinFromBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import type { BoardPinAction } from '../types/board.types';

interface UseRemovePinFromBoardOptions {
  onSuccess?: (boardId: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Мутация для удаления пина из доски.
 * 
 * Стратегия Pinterest:
 * - UI обновляется локально в компоненте
 * - Мутация отправляется в фоне
 * - Кэши инвалидируются для последующей синхронизации
 */
export const useRemovePinFromBoard = (options: UseRemovePinFromBoardOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ boardId, pinId }: BoardPinAction) =>
      boardApi.removePinFromBoard(boardId, pinId),

    onSuccess: (_, { boardId, pinId }) => {
      // Фоновая инвалидация
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.boards.forPin(pinId),
        refetchType: 'none',
      });
      
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.boards.pins(boardId),
        refetchType: 'none',
      });
      
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.boards.my(),
        refetchType: 'none',
      });

      onSuccess?.(boardId);
    },

    onError: (error: Error) => {
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