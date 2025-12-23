// src/modules/board/hooks/useSavePinToBoard.ts

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import type { BoardPinAction } from '../types/board.types';
import type { PinResponse, PagePinResponse } from '@/modules/pin';

interface UseSavePinToBoardOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

// ✅ Вынесены хелперы для уменьшения вложенности

/**
 * Creates updated pin with saved status
 */
const createSavedPin = (pin: PinResponse): PinResponse => ({
  ...pin,
  isSaved: true,
  savedToBoardCount: pin.savedToBoardCount + 1,
});

/**
 * Updates pin in array if it matches pinId
 */
const updatePinInArray = (pins: PinResponse[], pinId: string): PinResponse[] => {
  return pins.map((pin) => (pin.id === pinId ? createSavedPin(pin) : pin));
};

/**
 * Updates pages with saved pin status
 */
const updatePagesWithSavedPin = (
  data: InfiniteData<PagePinResponse> | undefined,
  pinId: string
): InfiniteData<PagePinResponse> | undefined => {
  if (!data?.pages) return data;
  
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      content: updatePinInArray(page.content, pinId),
    })),
  };
};

/**
 * Hook to save a pin to a single board
 */
export const useSavePinToBoard = (options: UseSavePinToBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: ({ boardId, pinId }: BoardPinAction) =>
      boardApi.savePinToBoard(boardId, pinId),
    
    onMutate: async ({ boardId, pinId }) => {
      // Cancel related queries
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.forPin(pinId) });

      // Snapshot previous data
      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      // Optimistic update for single pin
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          createSavedPin(previousPin)
        );
      }

      // Optimistic update for all pin lists
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePagesWithSavedPin(oldData, pinId)
      );

      return { previousPin, boardId, pinId };
    },

    onSuccess: (_, { boardId, pinId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });

      if (showToast) {
        toast.success('Pin saved to board!');
      }

      onSuccess?.();
    },

    onError: (error: Error, { pinId }, context) => {
      // Rollback
      if (context?.previousPin) {
        queryClient.setQueryData(
          queryKeys.pins.byId(pinId),
          context.previousPin
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });

      if (showToast) {
        toast.error(error.message || 'Failed to save pin');
      }

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