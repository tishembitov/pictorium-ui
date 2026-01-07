// src/modules/board/hooks/useCreateBoardWithPin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { useSelectBoard } from './useSelectBoard';
import type { BoardCreateRequest, BoardResponse } from '../types/board.types';
import type { PinResponse } from '@/modules/pin';

interface UseCreateBoardWithPinOptions {
  onSuccess?: (board: BoardResponse) => void;
  onError?: (error: Error) => void;
  autoSelect?: boolean;
  showToast?: boolean;
}

/**
 * Создаёт доску и сохраняет пин в одном запросе.
 * ✅ Оптимистично обновляет кэш пина.
 */
export const useCreateBoardWithPin = (
  pinId: string,
  options: UseCreateBoardWithPinOptions = {}
) => {
  const {
    onSuccess,
    onError,
    autoSelect = true,
    showToast = true,
  } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectBoard } = useSelectBoard();

  const mutation = useMutation({
    mutationFn: (data: BoardCreateRequest) =>
      boardApi.createWithPin(pinId, data),

    onSuccess: (board) => {
      // ✅ КЛЮЧЕВОЕ: Оптимистичное обновление кэша пина
      // API createWithPin возвращает BoardResponse, а не PinResponse
      // Поэтому обновляем вручную
      queryClient.setQueryData<PinResponse | undefined>(
        queryKeys.pins.byId(pinId),
        (oldPin) => {
          if (!oldPin) return oldPin;

          return {
            ...oldPin,
            savedToBoardsCount: oldPin.savedToBoardsCount + 1,
            lastSavedBoardId: board.id,
            lastSavedBoardName: board.title,
          };
        }
      );

      // Board-related инвалидации
      void queryClient.invalidateQueries({
        queryKey: queryKeys.boards.all,
        refetchType: 'none',
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.boards.forPin(pinId),
        refetchType: 'none',
      });

      // Pin lists инвалидация
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });

      if (autoSelect) {
        selectBoard(board.id);
      }

      if (showToast) {
        toast.board.created(board.title);
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
    data: mutation.data,
    reset: mutation.reset,
  };
};

export default useCreateBoardWithPin;