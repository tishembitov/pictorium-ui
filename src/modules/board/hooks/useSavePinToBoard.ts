// src/modules/board/hooks/useSavePinToBoard.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import type { BoardPinAction, BoardResponse } from '../types/board.types';
import type { PinResponse, PagePinResponse } from '@/modules/pin';

interface UseSavePinToBoardOptions {
  onSuccess?: (boardId: string, boardName: string, updatedPin: PinResponse) => void;
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

/**
 * Создаёт optimistic update для пина
 */
const createOptimisticSavedPin = (
  pin: PinResponse, 
  boardId: string, 
  boardName: string
): PinResponse => ({
  ...pin,
  savedToBoardsCount: pin.savedToBoardsCount + 1,
  lastSavedBoardId: boardId,
  lastSavedBoardName: boardName,
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
 * Hook to save a pin to a specific board
 * Uses POST /api/v1/boards/{boardId}/pins/{pinId}
 */
export const useSavePinToBoard = (options: UseSavePinToBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: async ({ boardId, pinId }: BoardPinAction) => {
      const updatedPin = await boardApi.savePinToBoard(boardId, pinId);
      return { boardId, updatedPin };
    },

    onMutate: async ({ pinId, boardId }) => {
      // Получаем название доски из кэша
      const board = queryClient.getQueryData<BoardResponse>(queryKeys.boards.byId(boardId));
      const boards = queryClient.getQueryData<BoardResponse[]>(queryKeys.boards.my());
      const boardFromList = boards?.find(b => b.id === boardId);
      const boardName = board?.title || boardFromList?.title || '';

      // Cancel queries
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.pins(boardId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.my() });
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
          createOptimisticSavedPin(previousPin, boardId, boardName)
        );
      }

      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, (pin) => 
          createOptimisticSavedPin(pin, boardId, boardName)
        )
      );

      return { previousPin, previousLists, pinId, boardId, boardName };
    },

    onSuccess: ({ boardId, updatedPin }, { pinId }, context) => {
      const boardName = context?.boardName || '';

      // Обновляем кэш реальными данными с сервера
      queryClient.setQueryData(queryKeys.pins.byId(pinId), updatedPin);

      // Обновляем пин во всех списках реальными данными
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, () => updatedPin)
      );

      // Инвалидируем связанные запросы
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });

      if (userId) {
        void queryClient.invalidateQueries({
          predicate: (query) => isSavedPinsQuery(query.queryKey, userId),
        });
      }

      if (showToast && boardName) {
        toast.success(`Saved to "${boardName}"`);
      }

      onSuccess?.(boardId, boardName, updatedPin);
    },

    onError: (error: Error, { pinId }, context) => {
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
    savePinToBoard: mutation.mutate,
    savePinToBoardAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useSavePinToBoard;