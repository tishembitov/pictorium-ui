// src/modules/board/hooks/useSavePinToBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import type { BoardPinAction } from '../types/board.types';
import type { PinResponse } from '@/modules/pin';

interface UseSavePinToBoardOptions {
  onSuccess?: (updatedPin: PinResponse, boardId: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Мутация для сохранения пина в доску.
 * 
 * Стратегия Pinterest:
 * - НЕ обновляем глобальные кэши оптимистично
 * - UI обновляется через локальный state компонента
 * - Только инвалидируем связанные запросы для фоновой синхронизации
 */
export const useSavePinToBoard = (options: UseSavePinToBoardOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ boardId, pinId }: BoardPinAction) => {
      const updatedPin = await boardApi.savePinToBoard(boardId, pinId);
      return { boardId, updatedPin };
    },

    onSuccess: ({ boardId, updatedPin }, { pinId }) => {
      // Фоновая инвалидация - данные обновятся при следующем fetch
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.boards.forPin(pinId),
        refetchType: 'none', // Не рефетчим сразу, только помечаем stale
      });
      
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.boards.pins(boardId),
        refetchType: 'none',
      });
      
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.boards.my(),
        refetchType: 'none',
      });

      onSuccess?.(updatedPin, boardId);
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    savePinToBoard: mutation.mutate,
    savePinToBoardAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useSavePinToBoard;