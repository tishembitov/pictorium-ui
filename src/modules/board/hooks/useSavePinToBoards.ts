// src/modules/board/hooks/useSavePinToBoards.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import type { BatchBoardPinAction, BoardResponse } from '../types/board.types';
import type { PinResponse, PagePinResponse } from '@/modules/pin';

interface UseSavePinToBoardsOptions {
  onSuccess?: (boardIds: string[]) => void;
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
 * ✅ Создаёт обновлённый пин после сохранения в несколько досок
 */
const createBatchSavedPin = (
  pin: PinResponse, 
  addedCount: number,
  lastBoardId: string,
  lastBoardName: string
): PinResponse => ({
  ...pin,
  // ✅ Убрано isSaved - вычисляется из savedToBoardsCount
  savedToBoardsCount: pin.savedToBoardsCount + addedCount,
  lastSavedBoardId: lastBoardId,
  lastSavedBoardName: lastBoardName,
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

      // Получаем название последней доски для отображения
      const lastBoardId = boardIds[boardIds.length - 1] || '';
      const boards = queryClient.getQueryData<BoardResponse[]>(queryKeys.boards.my());
      const lastBoard = boards?.find(b => b.id === lastBoardId);
      const lastBoardName = lastBoard?.title || '';

      const previousLists: Array<{
        key: QueryKey;
        data: InfiniteData<PagePinResponse> | undefined;
      }> = [];

      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({
        queryKey: queryKeys.pins.all,
      }).forEach(([key, data]) => {
        if (data) previousLists.push({ key, data });
      });

      // ✅ Optimistic update с новыми полями
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          createBatchSavedPin(previousPin, addedCount, lastBoardId, lastBoardName)
        );
      }

      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, (pin) =>
          createBatchSavedPin(pin, addedCount, lastBoardId, lastBoardName)
        )
      );

      return { previousPin, previousLists, pinId, boardIds, lastBoardName };
    },

    onSuccess: (_, { pinId, boardIds }) => {
      // Инвалидируем пин для получения актуальных данных
      void queryClient.invalidateQueries({ queryKey: queryKeys.pins.byId(pinId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });

      // Инвалидируем пины для каждой доски
      boardIds.forEach(boardId => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });
      });

      if (userId) {
        void queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            if (!Array.isArray(key)) return false;
            return isSavedPinsQuery(key, userId);
          },
        });
      }

      if (showToast) {
        const count = boardIds.length;
        const boardWord = count === 1 ? 'board' : 'boards';
        toast.success(`Saved to ${count} ${boardWord}!`);
      }

      onSuccess?.(boardIds);
    },

    onError: (error: Error, { pinId }, context) => {
      // Rollback
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