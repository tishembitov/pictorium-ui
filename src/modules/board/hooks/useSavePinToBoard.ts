// src/modules/board/hooks/useSavePinToBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import type { BoardPinAction } from '../types/board.types';
import type { PinResponse } from '@/modules/pin';

interface UseSavePinToBoardOptions {
  onSuccess?: (updatedPin: PinResponse, boardId: string) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Мутация для сохранения пина в доску.
 * ✅ Обновляет кэш пина данными от сервера для синхронизации состояния.
 */
export const useSavePinToBoard = (options: UseSavePinToBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ boardId, pinId }: BoardPinAction) => {
      const updatedPin = await boardApi.savePinToBoard(boardId, pinId);
      return { boardId, updatedPin };
    },

    onSuccess: ({ boardId, updatedPin }, { pinId }) => {
      // ✅ КЛЮЧЕВОЕ: Обновляем кэш конкретного пина данными от сервера
      // Это гарантирует, что при переходе на PinDetail данные будут актуальными
      queryClient.setQueryData(
        queryKeys.pins.byId(pinId),
        updatedPin
      );

      // Board-related инвалидации (фоновое обновление)
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

      // ✅ Инвалидируем списки пинов (для обновления savedToBoardsCount в гридах)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });

      if (showToast) {
        toast.pin.saved();
      }

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