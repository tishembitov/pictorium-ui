// src/modules/board/hooks/useSavePinToBoard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import type { BoardPinAction } from '../types/board.types';
import type { PinResponse } from '@/modules/pin';
import { useToast } from '@/shared';

interface UseSavePinToBoardOptions {
  onSuccess?: (updatedPin: PinResponse, boardId: string) => void;
  onError?: (error: Error) => void;
  showToast?: boolean; 
}

/**
 * Мутация для сохранения пина в доску.
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
      // Инвалидация board-related запросов
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

      // ✅ NEW: Инвалидация списков пинов (для ProfilePinsTab с scope: SAVED)
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.all,
        refetchType: 'none',
      });

      if (showToast) { // ✅ Проверяем флаг
        toast.pin.saved(); // или с boardName если доступен
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