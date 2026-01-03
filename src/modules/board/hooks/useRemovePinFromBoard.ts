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

const createUnsavedPin = (pin: PinResponse): PinResponse => {
  const newSavedCount = Math.max(0, pin.savedToBoardsCount - 1);
  return {
    ...pin,
    isSaved: newSavedCount > 0,
    savedToBoardsCount: newSavedCount,
    lastSavedBoardName: newSavedCount === 0 ? null : pin.lastSavedBoardName,
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
 * Убрать пин из доски
 * ✅ Пин НЕ удаляется, только убирается из доски
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

      const previousPin = queryClient.getQueryData<PinResponse>(queryKeys.pins.byId(pinId));

      const previousLists: Array<{ key: QueryKey; data: InfiniteData<PagePinResponse> | undefined }> = [];
      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({ queryKey: queryKeys.pins.all })
        .forEach(([key, data]) => { if (data) previousLists.push({ key, data }); });

      // Optimistic update - just decrease count, don't delete
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          createUnsavedPin(previousPin)
        );
      }

      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, createUnsavedPin)
      );

      // Remove from saved lists if no longer saved
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

      // Remove from board pins list
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

      queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });

      if (userId) {
        queryClient.invalidateQueries({
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