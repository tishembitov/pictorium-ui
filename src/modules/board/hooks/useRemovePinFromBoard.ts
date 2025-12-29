// src/modules/board/hooks/useRemovePinFromBoard.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { boardApi } from '../api/boardApi';
import { pinApi } from '@/modules/pin/api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import { shouldDeleteAfterBoardRemoval } from '@/modules/pin/utils/pinUtils';
import type { BoardPinAction } from '../types/board.types';
import type { PinResponse, PagePinResponse } from '@/modules/pin';

interface UseRemovePinFromBoardOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

const createUnsavedPin = (pin: PinResponse): PinResponse => {
  const newSavedCount = Math.max(0, pin.savedToBoardCount - 1);
  return {
    ...pin,
    isSaved: newSavedCount > 0 || pin.isSavedToProfile,
    savedToBoardCount: newSavedCount,
    savedToBoardName: newSavedCount === 0 ? null : pin.savedToBoardName,
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
      content: page.content.map((pin) => pin.id === pinId ? updater(pin) : pin),
    })),
  };
};

const removePinFromPages = (
  data: InfiniteData<PagePinResponse> | undefined,
  pinId: string
): InfiniteData<PagePinResponse> | undefined => {
  if (!data?.pages) return data;
  let removedCount = 0;
  return {
    ...data,
    pages: data.pages.map((page) => {
      const filteredContent = page.content.filter((pin) => {
        if (pin.id === pinId) { removedCount++; return false; }
        return true;
      });
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
  return filter?.savedAnywhere === userId || filter?.savedBy === userId || filter?.savedToProfileBy === userId;
};

export const useRemovePinFromBoard = (options: UseRemovePinFromBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: async ({ boardId, pinId }: BoardPinAction) => {
      const pin = queryClient.getQueryData<PinResponse>(queryKeys.pins.byId(pinId));
      const shouldDelete = shouldDeleteAfterBoardRemoval(pin, userId);
      
      if (shouldDelete) {
        await pinApi.delete(pinId);
        return { deleted: true, pinId, boardId };
      } else {
        await boardApi.removePinFromBoard(boardId, pinId);
        return { deleted: false, pinId, boardId };
      }
    },
    
    onMutate: async ({ boardId, pinId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.pins(boardId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      const previousPin = queryClient.getQueryData<PinResponse>(queryKeys.pins.byId(pinId));
      const shouldDelete = shouldDeleteAfterBoardRemoval(previousPin, userId);

      const previousLists: Array<{ key: QueryKey; data: InfiniteData<PagePinResponse> | undefined }> = [];
      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({ queryKey: queryKeys.pins.all })
        .forEach(([key, data]) => { if (data) previousLists.push({ key, data }); });

      if (shouldDelete) {
        // Полное удаление из всех списков
        queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
          { queryKey: queryKeys.pins.all },
          (oldData) => removePinFromPages(oldData, pinId)
        );
      } else {
        // Обновление статуса
        if (previousPin) {
          queryClient.setQueryData<PinResponse>(queryKeys.pins.byId(pinId), createUnsavedPin(previousPin));
        }
        queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
          { queryKey: queryKeys.pins.all },
          (oldData) => updatePinInPages(oldData, pinId, createUnsavedPin)
        );

        // Удаление из saved queries если больше нигде не сохранён
        if (previousPin && previousPin.savedToBoardCount <= 1 && !previousPin.isSavedToProfile && userId) {
          queryClient.getQueriesData<InfiniteData<PagePinResponse>>({ queryKey: queryKeys.pins.all })
            .forEach(([key]) => {
              if (isSavedPinsQuery(key, userId)) {
                queryClient.setQueryData<InfiniteData<PagePinResponse>>(
                  key, (oldData) => removePinFromPages(oldData, pinId)
                );
              }
            });
        }
      }

      return { previousPin, previousLists, pinId, boardId, shouldDelete };
    },

    onSuccess: (result) => {
      const { deleted, pinId, boardId } = result;
      
      if (deleted) {
        queryClient.removeQueries({ queryKey: queryKeys.pins.byId(pinId) });
        if (showToast) toast.success('Pin deleted');
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });
        if (userId) {
          queryClient.invalidateQueries({
            predicate: (query) => isSavedPinsQuery(query.queryKey, userId),
          });
        }
        if (showToast) toast.success('Pin removed from board');
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
      if (showToast) toast.error(error.message || 'Failed to remove pin');
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