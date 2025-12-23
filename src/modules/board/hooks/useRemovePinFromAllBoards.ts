// src/modules/board/hooks/useRemovePinFromAllBoards.ts

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import type { PinResponse, PagePinResponse } from '@/modules/pin';

interface UseRemovePinFromAllBoardsOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

// ✅ Вынесены хелперы для уменьшения вложенности

/**
 * Creates pin with cleared save status
 */
const createClearedPin = (pin: PinResponse): PinResponse => ({
  ...pin,
  isSaved: false,
  savedToBoardCount: 0,
  savedToBoardName: null,
});

/**
 * Updates pin in array if it matches pinId
 */
const updatePinInArray = (pins: PinResponse[], pinId: string): PinResponse[] => {
  return pins.map((pin) => (pin.id === pinId ? createClearedPin(pin) : pin));
};

/**
 * Updates pages with cleared save status
 */
const updatePagesWithClearedPin = (
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
 * Hook to remove a pin from all boards at once
 */
export const useRemovePinFromAllBoards = (options: UseRemovePinFromAllBoardsOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (pinId: string) => boardApi.removePinFromAllBoards(pinId),
    
    onMutate: async (pinId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });

      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      // Optimistic update for single pin
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          createClearedPin(previousPin)
        );
      }

      // Update all pin lists
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePagesWithClearedPin(oldData, pinId)
      );

      return { previousPin, pinId };
    },

    onSuccess: (_, pinId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });

      if (showToast) {
        toast.success('Pin removed from all boards');
      }

      onSuccess?.();
    },

    onError: (error: Error, pinId, context) => {
      if (context?.previousPin) {
        queryClient.setQueryData(
          queryKeys.pins.byId(pinId),
          context.previousPin
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });

      if (showToast) {
        toast.error(error.message || 'Failed to remove pin');
      }

      onError?.(error);
    },
  });

  return {
    removePinFromAllBoards: mutation.mutate,
    removePinFromAllBoardsAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useRemovePinFromAllBoards;