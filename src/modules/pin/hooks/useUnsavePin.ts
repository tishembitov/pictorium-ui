// src/modules/pin/hooks/useUnsavePin.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import type { PinResponse, PagePinResponse } from '../types/pin.types';

interface UseUnsavePinOptions {
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

const createUnsavedPin = (pin: PinResponse): PinResponse => {
  const newCount = Math.max(0, pin.savedToBoardsCount - 1);
  return {
    ...pin,
    savedToBoardsCount: newCount,
    // ✅ Очищаем информацию о последней доске если больше не сохранен
    lastSavedBoardId: newCount === 0 ? null : pin.lastSavedBoardId,
    lastSavedBoardName: newCount === 0 ? null : pin.lastSavedBoardName,
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

export const useUnsavePin = (options: UseUnsavePinOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinApi.unsave(pinId),

    onMutate: async (pinId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.all });

      const previousPin = findPinInCache(queryClient, pinId);

      const previousLists: Array<{ key: QueryKey; data: InfiniteData<PagePinResponse> | undefined }> = [];
      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({ queryKey: queryKeys.pins.all })
        .forEach(([key, data]) => { if (data) previousLists.push({ key, data }); });

      // Optimistic update
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

      return { previousPin, previousLists, pinId };
    },

    onSuccess: (_, pinId) => {
      // ✅ Рефетчим пин чтобы получить актуальные данные с сервера
      void queryClient.invalidateQueries({ queryKey: queryKeys.pins.byId(pinId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() });
      
      // Инвалидируем все board pins queries
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'boards' && key[1] === 'pins';
        }
      });

      if (userId) {
        void queryClient.invalidateQueries({
          predicate: (query) => isSavedPinsQuery(query.queryKey, userId),
        });
      }

      if (showToast) {
        toast.success('Removed from board');
      }

      onSuccess?.();
    },

    onError: (error: Error, pinId, context) => {
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
    unsavePin: mutation.mutate,
    unsavePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useUnsavePin;