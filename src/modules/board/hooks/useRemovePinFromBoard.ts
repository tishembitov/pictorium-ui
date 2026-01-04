// src/modules/board/hooks/useRemovePinFromBoard.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import type { BoardPinAction } from '../types/board.types';
import type { PinResponse, PagePinResponse } from '@/modules/pin';

interface UseRemovePinFromBoardOptions {
  onSuccess?: () => void;
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
 * Создаёт обновлённый пин после удаления из доски
 */
const createUnsavedPin = (pin: PinResponse, removedBoardId: string): PinResponse => {
  const newSavedCount = Math.max(0, pin.savedToBoardsCount - 1);
  
  // Если удалили из последней сохранённой доски - очищаем информацию
  const wasLastBoard = pin.lastSavedBoardId === removedBoardId;
  
  return {
    ...pin,
    savedToBoardsCount: newSavedCount,
    // Если это была последняя доска или больше нет сохранений - очищаем
    lastSavedBoardId: newSavedCount === 0 || wasLastBoard ? null : pin.lastSavedBoardId,
    lastSavedBoardName: newSavedCount === 0 || wasLastBoard ? null : pin.lastSavedBoardName,
  };
};

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

const removePinFromPages = (
  data: InfiniteData<PagePinResponse> | undefined,
  pinId: string
): InfiniteData<PagePinResponse> | undefined => {
  if (!data?.pages) return data;

  return {
    ...data,
    pages: data.pages.map((page) => {
      const filteredContent = page.content.filter((pin) => pin.id !== pinId);
      const removedCount = page.content.length - filteredContent.length;
      return {
        ...page,
        content: filteredContent,
        numberOfElements: filteredContent.length,
        totalElements: Math.max(0, page.totalElements - removedCount),
      };
    }),
  };
};

const isSavedPinsQuery = (queryKey: QueryKey, userId: string): boolean => {
  if (!Array.isArray(queryKey) || queryKey[0] !== 'pins' || queryKey[1] !== 'list') return false;
  const filter = queryKey[2] as Record<string, unknown> | undefined;
  return filter?.savedBy === userId;
};

// ==================== Hook ====================

/**
 * Hook to remove a pin from a specific board
 * Uses DELETE /api/v1/boards/{boardId}/pins/{pinId}
 */
export const useRemovePinFromBoard = (options: UseRemovePinFromBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: ({ boardId, pinId }: BoardPinAction) =>
      boardApi.removePinFromBoard(boardId, pinId),

    onMutate: async ({ boardId, pinId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.pins(boardId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      const previousPin = findPinInCache(queryClient, pinId);

      const previousLists: Array<{ key: QueryKey; data: InfiniteData<PagePinResponse> | undefined }> = [];
      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({ queryKey: queryKeys.pins.all })
        .forEach(([key, data]) => { if (data) previousLists.push({ key, data }); });

      // Optimistic update
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          createUnsavedPin(previousPin, boardId)
        );
      }

      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, (pin) => createUnsavedPin(pin, boardId))
      );

      // Удаляем из saved списков если это была последняя доска
      if (previousPin && previousPin.savedToBoardsCount <= 1 && userId) {
        queryClient.getQueriesData<InfiniteData<PagePinResponse>>({ queryKey: queryKeys.pins.all })
          .forEach(([key]) => {
            if (isSavedPinsQuery(key, userId)) {
              queryClient.setQueryData<InfiniteData<PagePinResponse>>(
                key, (oldData) => removePinFromPages(oldData, pinId)
              );
            }
          });
      }

      // Удаляем пин из списка пинов доски
      queryClient.setQueryData<InfiniteData<PagePinResponse>>(
        [...queryKeys.boards.pins(boardId), 'infinite'],
        (oldData) => removePinFromPages(oldData, pinId)
      );

      return { previousPin, previousLists, pinId, boardId };
    },

    onSuccess: (_, { boardId, pinId }) => {
      if (showToast) {
        toast.success('Removed from board');
      }

      // Рефетчим пин для получения актуальных данных с сервера
      void queryClient.invalidateQueries({ queryKey: queryKeys.pins.byId(pinId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });

      if (userId) {
        void queryClient.invalidateQueries({
          predicate: (query) => isSavedPinsQuery(query.queryKey, userId),
        });
      }

      onSuccess?.();
    },

    onError: (error: Error, { pinId }, context) => {
      if (context?.previousPin) {
        queryClient.setQueryData(queryKeys.pins.byId(pinId), context.previousPin);
      }
      if (context?.previousLists) {
        for (const { key, data } of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }

      if (showToast) {
        toast.error(error.message || 'Failed to remove pin');
      }
      onError?.(error);
    },
  });

  return {
    removePinFromBoard: mutation.mutate,
    removePinFromBoardAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useRemovePinFromBoard;