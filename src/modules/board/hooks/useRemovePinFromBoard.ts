// src/modules/board/hooks/useRemovePinFromBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import type { PinResponse } from '@/modules/pin';

interface UseRemovePinFromBoardOptions {
  onSuccess?: (boardId: string) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Мутация для удаления пина из доски.
 * ✅ Оптимистично обновляет кэш пина для синхронизации состояния.
 */
export const useRemovePinFromBoard = (options: UseRemovePinFromBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: ({ boardId, pinId }: { boardId: string; pinId: string }) =>
      boardApi.removePinFromBoard(boardId, pinId),

    onSuccess: (_, { boardId, pinId }) => {
      // ✅ КЛЮЧЕВОЕ: Оптимистичное обновление кэша пина
      // API возвращает void, поэтому обновляем вручную
      queryClient.setQueryData<PinResponse | undefined>(
        queryKeys.pins.byId(pinId),
        (oldPin) => {
          if (!oldPin) return oldPin;

          const newSavedCount = Math.max(0, oldPin.savedToBoardsCount - 1);
          const wasLastSavedBoard = oldPin.lastSavedBoardId === boardId;

          return {
            ...oldPin,
            savedToBoardsCount: newSavedCount,
            // Очищаем lastSaved если удалили последнюю доску или текущую lastSaved доску
            lastSavedBoardId: newSavedCount === 0 || wasLastSavedBoard
              ? null
              : oldPin.lastSavedBoardId,
            lastSavedBoardName: newSavedCount === 0 || wasLastSavedBoard
              ? null
              : oldPin.lastSavedBoardName,
          };
        }
      );

      // Board-related инвалидации
      void queryClient.invalidateQueries({
        queryKey: queryKeys.boards.pins(boardId),
        refetchType: 'none',
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.boards.forPin(pinId),
        refetchType: 'none',
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.boards.my(),
        refetchType: 'none',
      });

      // ✅ Инвалидируем списки пинов
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });

      if (showToast) {
        toast.pin.removed();
      }

      onSuccess?.(boardId);
    },

    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to remove pin');
      }
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