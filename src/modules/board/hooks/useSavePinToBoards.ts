// src/modules/board/hooks/useSavePinToBoards.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import type { PinResponse } from '@/modules/pin';

interface UseSavePinToBoardsOptions {
  onSuccess?: (boardIds: string[], updatedPin: PinResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Мутация для сохранения пина в несколько досок.
 * ✅ Обновляет кэш пина данными от сервера.
 */
export const useSavePinToBoards = (options: UseSavePinToBoardsOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ pinId, boardIds }: { pinId: string; boardIds: string[] }) => {
      const updatedPin = await boardApi.savePinToBoards(pinId, boardIds);
      return { boardIds, updatedPin, pinId };
    },

    onSuccess: ({ boardIds, updatedPin, pinId }) => {
      // ✅ КЛЮЧЕВОЕ: Обновляем кэш пина данными от сервера
      queryClient.setQueryData(
        queryKeys.pins.byId(pinId),
        updatedPin
      );

      // Board-related инвалидации
      void queryClient.invalidateQueries({
        queryKey: queryKeys.boards.forPin(pinId),
        refetchType: 'none',
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.boards.my(),
        refetchType: 'none',
      });

      // Инвалидируем пины каждой доски
      boardIds.forEach((boardId) => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.boards.pins(boardId),
          refetchType: 'none',
        });
      });

      // Инвалидируем списки пинов
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });

      if (showToast) {
        toast.pin.savedMultiple(boardIds.length);
      }

      onSuccess?.(boardIds, updatedPin);
    },

    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to save pin');
      }
      onError?.(error);
    },
  });

  return {
    savePinToBoards: mutation.mutate,
    savePinToBoardsAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useSavePinToBoards;