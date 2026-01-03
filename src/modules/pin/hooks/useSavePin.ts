// src/modules/pin/hooks/useSavePin.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import { useSelectedBoardStore } from '@/modules/board/stores/selectedBoardStore';
import type { PinResponse, PagePinResponse } from '../types/pin.types';

interface UseSavePinOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

// ==================== Helpers ====================

const findPinInCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  pinId: string
): PinResponse | undefined => {
  const singlePin = queryClient.getQueryData<PinResponse>(queryKeys.pins.byId(pinId));
  if (singlePin) return singlePin;

  const allQueries = queryClient.getQueriesData<InfiniteData<PagePinResponse>>({
    queryKey: queryKeys.pins.all,
  });

  for (const [, data] of allQueries) {
    if (!data?.pages) continue;
    for (const page of data.pages) {
      const found = page.content.find((p) => p.id === pinId);
      if (found) return found;
    }
  }

  return undefined;
};

const createSavedPin = (pin: PinResponse, boardName?: string): PinResponse => ({
  ...pin,
  isSaved: true,
  savedToBoardsCount: pin.savedToBoardsCount + 1,
  lastSavedBoardName: boardName || pin.lastSavedBoardName,
});

const updatePinInPages = (
  data: InfiniteData<PagePinResponse> | undefined,
  pinId: string,
  updater: (pin: PinResponse) => PinResponse
): InfiniteData<PagePinResponse> | undefined => {
  if (!data?.pages) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      content: page.content.map((pin) => (pin.id === pinId ? updater(pin) : pin)),
    })),
  };
};

const isSavedPinsQuery = (queryKey: QueryKey, userId: string): boolean => {
  if (!Array.isArray(queryKey) || queryKey[0] !== 'pins' || queryKey[1] !== 'list') return false;
  const filter = queryKey[2] as Record<string, unknown> | undefined;
  return filter?.savedBy === userId;
};

// ==================== Hook ====================

/**
 * Сохранить пин в выбранную доску
 * Требует, чтобы доска была выбрана в selectedBoardStore
 */
export const useSavePin = (options: UseSavePinOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);
  const selectedBoard = useSelectedBoardStore((state) => state.selectedBoard);

  const mutation = useMutation({
    mutationFn: (pinId: string) => {
      if (!selectedBoard) {
        throw new Error('No board selected. Please select a board first.');
      }
      return pinApi.save(pinId);
    },

    onMutate: async (pinId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      const previousPin = findPinInCache(queryClient, pinId);

      const previousLists: Array<{
        key: QueryKey;
        data: InfiniteData<PagePinResponse> | undefined;
      }> = [];

      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({
        queryKey: queryKeys.pins.all,
      }).forEach(([key, data]) => {
        if (data) previousLists.push({ key, data });
      });

      // Optimistic update
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          createSavedPin(previousPin, selectedBoard?.title)
        );
      }

      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, (pin) => 
          createSavedPin(pin, selectedBoard?.title)
        )
      );

      return { previousPin, previousLists, pinId };
    },

    onSuccess: (data, pinId) => {
      // Update with real data from server
      queryClient.setQueryData(queryKeys.pins.byId(pinId), data);
      
      // Invalidate related queries
      if (selectedBoard) {
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(selectedBoard.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });
      }

      if (userId) {
        queryClient.invalidateQueries({
          predicate: (query) => isSavedPinsQuery(query.queryKey, userId),
        });
      }

      if (showToast && selectedBoard) {
        toast.success(`Saved to "${selectedBoard.title}"`);
      }

      onSuccess?.(data);
    },

    onError: (error: Error, pinId, context) => {
      // Rollback
      if (context?.previousPin) {
        queryClient.setQueryData(queryKeys.pins.byId(pinId), context.previousPin);
      }
      if (context?.previousLists) {
        for (const { key, data } of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }

      if (showToast) {
        toast.error(error.message || 'Failed to save pin');
      }

      onError?.(error);
    },
  });

  return {
    savePin: mutation.mutate,
    savePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    hasSelectedBoard: !!selectedBoard,
    selectedBoardName: selectedBoard?.title,
  };
};

export default useSavePin;