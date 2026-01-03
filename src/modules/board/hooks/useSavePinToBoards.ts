// src/modules/board/hooks/useSavePinToBoards.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import type { BatchBoardPinAction } from '../types/board.types';
import type { PinResponse, PagePinResponse } from '@/modules/pin';

interface UseSavePinToBoardsOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

// ==================== Helper: Find Pin in Cache ====================

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

// ==================== Helpers ====================

const createBatchSavedPin = (pin: PinResponse, addedCount: number): PinResponse => ({
  ...pin,
  isSaved: true,
  savedToBoardsCount: pin.savedToBoardsCount + addedCount, // ✅ Исправлено
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

const isSavedPinsQuery = (queryKey: unknown[], userId: string): boolean => {
  if (queryKey[0] !== 'pins' || queryKey[1] !== 'list') return false;
  const filter = queryKey[2] as Record<string, unknown> | undefined;
  return filter?.savedBy === userId;
};

// ==================== Hook ====================

export const useSavePinToBoards = (options: UseSavePinToBoardsOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: ({ pinId, boardIds }: BatchBoardPinAction) =>
      boardApi.savePinToBoards(pinId, boardIds),

    onMutate: async ({ pinId, boardIds }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      const previousPin = findPinInCache(queryClient, pinId);
      const addedCount = boardIds.length;

      const previousLists: Array<{
        key: QueryKey;
        data: InfiniteData<PagePinResponse> | undefined;
      }> = [];

      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({
        queryKey: queryKeys.pins.all,
      }).forEach(([key, data]) => {
        if (data) previousLists.push({ key, data });
      });

      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          createBatchSavedPin(previousPin, addedCount)
        );
      }

      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, (pin) =>
          createBatchSavedPin(pin, addedCount)
        )
      );

      return { previousPin, previousLists, pinId, boardIds };
    },

    onSuccess: (_, { pinId, boardIds }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.byId(pinId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });

      boardIds.forEach(boardId => {
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });
      });

      if (userId) {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            if (!Array.isArray(key)) return false;
            return isSavedPinsQuery(key, userId);
          },
        });
      }

      if (showToast) {
        const count = boardIds.length;
        toast.success(`Pin saved to ${count} ${count === 1 ? 'board' : 'boards'}!`);
      }

      onSuccess?.();
    },

    onError: (error: Error, { pinId }, context) => {
      if (context?.previousPin) {
        queryClient.setQueryData(
          queryKeys.pins.byId(pinId),
          context.previousPin
        );
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
    savePinToBoards: mutation.mutate,
    savePinToBoardsAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useSavePinToBoards;