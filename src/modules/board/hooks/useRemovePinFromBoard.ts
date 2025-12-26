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

/**
 * Creates updated pin with decremented save count
 */
const createUnsavedPin = (pin: PinResponse): PinResponse => {
  const newSavedCount = Math.max(0, pin.savedToBoardCount - 1);
  return {
    ...pin,
    isSaved: newSavedCount > 0 || pin.isSavedToProfile,
    savedToBoardCount: newSavedCount,
    savedToBoardName: newSavedCount === 0 ? null : pin.savedToBoardName,
  };
};

/**
 * Updates pin in array if it matches pinId
 */
const updatePinInArray = (pins: PinResponse[], pinId: string): PinResponse[] => {
  return pins.map((pin) => (pin.id === pinId ? createUnsavedPin(pin) : pin));
};

/**
 * Updates pages with unsaved pin status
 */
const updatePagesWithUnsavedPin = (
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
 * Removes pin from pages and updates counts
 */
const removePinFromPages = (
  data: InfiniteData<PagePinResponse> | undefined,
  pinId: string
): InfiniteData<PagePinResponse> | undefined => {
  if (!data?.pages) return data;
  
  let removedCount = 0;
  
  const newPages = data.pages.map((page) => {
    const originalLength = page.content.length;
    const filteredContent = page.content.filter((pin) => pin.id !== pinId);
    removedCount += originalLength - filteredContent.length;
    
    return {
      ...page,
      content: filteredContent,
      numberOfElements: filteredContent.length,
      totalElements: Math.max(0, page.totalElements - removedCount),
    };
  });
  
  return {
    ...data,
    pages: newPages,
  };
};

/**
 * Check if query is for user's saved pins
 */
const isSavedPinsQuery = (queryKey: QueryKey, userId: string): boolean => {
  if (!Array.isArray(queryKey) || queryKey[0] !== 'pins' || queryKey[1] !== 'list') return false;
  const filter = queryKey[2] as Record<string, unknown> | undefined;
  return filter?.savedAnywhere === userId || 
         filter?.savedBy === userId || 
         filter?.savedToProfileBy === userId;
};

/**
 * Hook to remove a pin from a single board
 */
export const useRemovePinFromBoard = (options: UseRemovePinFromBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: ({ boardId, pinId }: BoardPinAction) =>
      boardApi.removePinFromBoard(boardId, pinId),
    
    onMutate: async ({ pinId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.forPin(pinId) });

      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      // Collect saved pins queries for potential removal
      const previousSavedQueries: Array<{
        key: QueryKey;
        data: InfiniteData<PagePinResponse> | undefined;
      }> = [];
      
      if (userId) {
        queryClient.getQueriesData<InfiniteData<PagePinResponse>>({
          queryKey: queryKeys.pins.all,
        }).forEach(([key, data]) => {
          if (isSavedPinsQuery(key, userId)) {
            previousSavedQueries.push({ key, data });
          }
        });
      }

      // Optimistic update for single pin
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          createUnsavedPin(previousPin)
        );
      }

      // Update all pin lists
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePagesWithUnsavedPin(oldData, pinId)
      );

      // If pin is no longer saved anywhere, remove from saved queries
      if (previousPin && previousPin.savedToBoardCount <= 1 && !previousPin.isSavedToProfile) {
        for (const { key } of previousSavedQueries) {
          queryClient.setQueryData<InfiniteData<PagePinResponse>>(
            key,
            (oldData) => removePinFromPages(oldData, pinId)
          );
        }
      }

      return { previousPin, previousSavedQueries, pinId };
    },

    onSuccess: (_, { boardId, pinId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });

      // Invalidate user's saved pins queries
      if (userId) {
        queryClient.invalidateQueries({
          predicate: (query) => isSavedPinsQuery(query.queryKey, userId),
        });
      }

      if (showToast) {
        toast.success('Pin removed from board');
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
      
      // Rollback saved queries
      if (context?.previousSavedQueries) {
        for (const { key, data } of context.previousSavedQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });

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