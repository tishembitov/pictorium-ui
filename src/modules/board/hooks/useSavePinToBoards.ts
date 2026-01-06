// src/modules/board/hooks/useSavePinToBoards.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import type { PinResponse } from '@/modules/pin';

interface UseSavePinToBoardsOptions {
  onSuccess?: (boardIds: string[], updatedPin: PinResponse) => void;
  onError?: (error: Error) => void;
}

export const useSavePinToBoards = (options: UseSavePinToBoardsOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ pinId, boardIds }: { pinId: string; boardIds: string[] }) => {
      const updatedPin = await boardApi.savePinToBoards(pinId, boardIds);
      return { boardIds, updatedPin };
    },

    onSuccess: ({ boardIds, updatedPin }, { pinId }) => {
      // Board-related
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.boards.forPin(pinId),
        refetchType: 'none',
      });
      
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.boards.my(),
        refetchType: 'none',
      });

      boardIds.forEach(boardId => {
        void queryClient.invalidateQueries({ 
          queryKey: queryKeys.boards.pins(boardId),
          refetchType: 'none',
        });
      });

      // ✅ Pin lists
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });

      const count = boardIds.length;
      toast.pin.saved(count === 1 ? 'board' : 'boards');
      
      onSuccess?.(boardIds, updatedPin);
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save pin'); // Можно поменять на пресет, если потребуется
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