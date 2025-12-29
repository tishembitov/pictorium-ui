// src/modules/board/hooks/useSavePinToBoard.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import type { BoardPinAction } from '../types/board.types';
import type { PinResponse, PagePinResponse } from '@/modules/pin';

interface UseSavePinToBoardOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

// ==================== Logging ====================

const LOG_PREFIX = '[SavePinToBoard]';

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

const createSavedPin = (pin: PinResponse): PinResponse => ({
  ...pin,
  isSaved: true,
  savedToBoardCount: pin.savedToBoardCount + 1,
});

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

const isSavedPinsQuery = (queryKey: unknown[], userId: string): boolean => {
  if (queryKey[0] !== 'pins' || queryKey[1] !== 'list') return false;
  const filter = queryKey[2] as Record<string, unknown> | undefined;
  return filter?.savedAnywhere === userId ||
    filter?.savedBy === userId ||
    filter?.savedToProfileBy === userId;
};

// ==================== Hook ====================

export const useSavePinToBoard = (options: UseSavePinToBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: ({ boardId, pinId }: BoardPinAction) => {
      console.log(`${LOG_PREFIX} ========================================`);
      console.log(`${LOG_PREFIX} Executing API call`);
      console.log(`${LOG_PREFIX} Pin: ${pinId}, Board: ${boardId}`);
      return boardApi.savePinToBoard(boardId, pinId);
    },

    onMutate: async ({ pinId, boardId }) => {
      console.log(`${LOG_PREFIX} onMutate - Starting`);
      
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.pins(boardId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.my() });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      const previousPin = findPinInCache(queryClient, pinId);
      logPinState('Previous state', previousPin);

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
        const updatedPin = createSavedPin(previousPin);
        logPinState('Optimistic update', updatedPin);
        queryClient.setQueryData<PinResponse>(queryKeys.pins.byId(pinId), updatedPin);
      }

      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, createSavedPin)
      );

      console.log(`${LOG_PREFIX} onMutate - Complete`);
      return { previousPin, previousLists, pinId, boardId };
    },

    onSuccess: (_, { boardId, pinId }) => {
      console.log(`${LOG_PREFIX} onSuccess`);
      
      // ✅ Инвалидируем ВСЕ связанные с досками запросы
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() }); // ✅ Обновит pinCount

      // ✅ Инвалидируем пины ВСЕХ досок для обновления превью
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'boards' && key[1] === 'pins';
        }
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
        toast.success('Pin saved to board!');
      }

      console.log(`${LOG_PREFIX} ========================================`);
      onSuccess?.();
    },

    onError: (error: Error, { pinId }, context) => {
      console.error(`${LOG_PREFIX} onError - Rolling back`, error.message);

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

      console.log(`${LOG_PREFIX} ========================================`);
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