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

// ==================== Logging ====================

const LOG_PREFIX = '[SavePinToBoards]';

const logPinState = (label: string, pin: PinResponse | undefined) => {
  if (!pin) {
    console.log(`${LOG_PREFIX} ${label}: pin is undefined`);
    return;
  }
  console.log(`${LOG_PREFIX} ${label}:`, {
    id: pin.id,
    isSaved: pin.isSaved,
    isSavedToProfile: pin.isSavedToProfile,
    savedToBoardCount: pin.savedToBoardCount,
  });
};

const logCacheUpdate = (action: string, details?: Record<string, unknown>) => {
  console.log(`${LOG_PREFIX} Cache Update - ${action}`, details || '');
};

// ==================== Helper: Find Pin in Cache ====================

const findPinInCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  pinId: string
): PinResponse | undefined => {
  // Try single pin cache first
  const singlePin = queryClient.getQueryData<PinResponse>(queryKeys.pins.byId(pinId));
  if (singlePin) {
    console.log(`${LOG_PREFIX} Found pin in single cache`);
    return singlePin;
  }

  // Search in lists
  console.log(`${LOG_PREFIX} Searching pin in lists...`);
  const allQueries = queryClient.getQueriesData<InfiniteData<PagePinResponse>>({
    queryKey: queryKeys.pins.all,
  });

  for (const [key, data] of allQueries) {
    if (!data?.pages) continue;
    for (const page of data.pages) {
      const found = page.content.find((p) => p.id === pinId);
      if (found) {
        console.log(`${LOG_PREFIX} Found pin in list:`, JSON.stringify(key).slice(0, 100));
        return found;
      }
    }
  }

  console.log(`${LOG_PREFIX} Pin NOT found in any cache`);
  return undefined;
};

// ==================== Helpers ====================

/**
 * Creates updated pin with saved status for batch save
 */
const createBatchSavedPin = (pin: PinResponse, addedCount: number): PinResponse => {
  const updated = {
    ...pin,
    isSaved: true,
    savedToBoardCount: pin.savedToBoardCount + addedCount,
  };
  logPinState(`After batch save (+${addedCount})`, updated);
  return updated;
};

/**
 * Updates pin in pages
 */
const updatePinInPages = (
  data: InfiniteData<PagePinResponse> | undefined,
  pinId: string,
  updater: (pin: PinResponse) => PinResponse
): InfiniteData<PagePinResponse> | undefined => {
  if (!data?.pages) return data;

  let updateCount = 0;
  const result = {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      content: page.content.map((pin) => {
        if (pin.id === pinId) {
          updateCount++;
          return updater(pin);
        }
        return pin;
      }),
    })),
  };

  if (updateCount > 0) {
    logCacheUpdate('updatePinInPages', { pinId, updateCount });
  }
  return result;
};

/**
 * Check if query is for user's saved pins
 */
const isSavedPinsQuery = (queryKey: unknown[], userId: string): boolean => {
  if (queryKey[0] !== 'pins' || queryKey[1] !== 'list') return false;
  const filter = queryKey[2] as Record<string, unknown> | undefined;
  return filter?.savedAnywhere === userId ||
    filter?.savedBy === userId ||
    filter?.savedToProfileBy === userId;
};

// ==================== Hook ====================

export const useSavePinToBoards = (options: UseSavePinToBoardsOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: ({ pinId, boardIds }: BatchBoardPinAction) => {
      console.log(`${LOG_PREFIX} ========================================`);
      console.log(`${LOG_PREFIX} Executing API call`);
      console.log(`${LOG_PREFIX} Pin: ${pinId}`);
      console.log(`${LOG_PREFIX} Boards: ${boardIds.join(', ')} (${boardIds.length} total)`);
      return boardApi.savePinToBoards(pinId, boardIds);
    },

    onMutate: async ({ pinId, boardIds }) => {
      console.log(`${LOG_PREFIX} onMutate - Starting`);
      console.log(`${LOG_PREFIX} Pin: ${pinId}`);
      console.log(`${LOG_PREFIX} Boards count: ${boardIds.length}`);

      // Cancel related queries
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      // ✅ Ищем пин в кэше (включая списки)
      const previousPin = findPinInCache(queryClient, pinId);
      logPinState('Previous state', previousPin);

      const addedCount = boardIds.length;

      // Сохраняем для rollback
      const previousLists: Array<{
        key: QueryKey;
        data: InfiniteData<PagePinResponse> | undefined;
      }> = [];

      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({
        queryKey: queryKeys.pins.all,
      }).forEach(([key, data]) => {
        if (data) previousLists.push({ key, data });
      });

      console.log(`${LOG_PREFIX} Saved ${previousLists.length} list snapshots for rollback`);

      // Оптимистичное обновление для single pin
      if (previousPin) {
        const updatedPin = createBatchSavedPin(previousPin, addedCount);
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          updatedPin
        );
        logCacheUpdate('Updated single pin cache');
      }

      // Оптимистичное обновление для всех списков
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, (pin) =>
          createBatchSavedPin(pin, addedCount)
        )
      );

      console.log(`${LOG_PREFIX} onMutate - Complete`);
      return { previousPin, previousLists, pinId, boardIds };
    },

    onSuccess: (_, { pinId, boardIds }) => {
      console.log(`${LOG_PREFIX} onSuccess`);
      console.log(`${LOG_PREFIX} Saved to ${boardIds.length} boards`);

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.byId(pinId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });

      // Invalidate each affected board's pins
      boardIds.forEach(boardId => {
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });
      });

      // Invalidate user's saved pins queries
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

      console.log(`${LOG_PREFIX} ========================================`);
      onSuccess?.();
    },

    onError: (error: Error, { pinId }, context) => {
      console.error(`${LOG_PREFIX} onError - Rolling back`, error.message);

      // Rollback single pin
      if (context?.previousPin) {
        queryClient.setQueryData(
          queryKeys.pins.byId(pinId),
          context.previousPin
        );
        logCacheUpdate('Rolled back single pin');
      }

      // Rollback all lists
      if (context?.previousLists) {
        for (const { key, data } of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
        logCacheUpdate('Rolled back all lists', { count: context.previousLists.length });
      }

      if (showToast) {
        toast.error(error.message || 'Failed to save pin');
      }

      console.log(`${LOG_PREFIX} ========================================`);
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