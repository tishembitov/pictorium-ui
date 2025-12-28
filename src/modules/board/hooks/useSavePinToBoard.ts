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

/**
 * Creates updated pin with saved status
 */
const createSavedPin = (pin: PinResponse): PinResponse => ({
  ...pin,
  isSaved: true,
  savedToBoardCount: pin.savedToBoardCount + 1,
});

/**
 * Updates pin in pages
 */
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
      content: page.content.map((pin) =>
        pin.id === pinId ? updater(pin) : pin
      ),
    })),
  };
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

/**
 * Hook to save a pin to a single board
 */
export const useSavePinToBoard = (options: UseSavePinToBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: ({ boardId, pinId }: BoardPinAction) =>
      boardApi.savePinToBoard(boardId, pinId),

    onMutate: async ({ pinId }) => {
      // Cancel related queries
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      // Snapshot previous single pin
      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      // Snapshot ALL pin lists for proper rollback
      const previousLists: Array<{
        key: QueryKey;
        data: InfiniteData<PagePinResponse> | undefined;
      }> = [];

      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({
        queryKey: queryKeys.pins.all,
      }).forEach(([key, data]) => {
        previousLists.push({ key, data });
      });

      // Optimistic update for single pin
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          createSavedPin(previousPin)
        );
      }

      // Optimistic update for all pin lists
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, createSavedPin)
      );

      return { previousPin, previousLists, pinId };
    },

    onSuccess: (_, { boardId, pinId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });

      // Invalidate user's saved pins queries to refresh counts on profile
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

      onSuccess?.();
    },

    onError: (error: Error, { pinId }, context) => {
      // Rollback single pin
      if (context?.previousPin) {
        queryClient.setQueryData(
          queryKeys.pins.byId(pinId),
          context.previousPin
        );
      }

      // Rollback all pin lists
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