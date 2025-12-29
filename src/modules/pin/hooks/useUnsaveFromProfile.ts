// src/modules/pin/hooks/useUnsaveFromProfile.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import { shouldDeleteAfterProfileRemoval } from '../utils/pinUtils';
import type { PinResponse, PagePinResponse } from '../types/pin.types';

interface UseUnsaveFromProfileOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

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

const createUnsavedFromProfilePin = (pin: PinResponse): PinResponse => ({
  ...pin,
  isSavedToProfile: false,
  isSaved: pin.savedToBoardCount > 0,
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
  return filter?.savedAnywhere === userId || filter?.savedToProfileBy === userId;
};

// ==================== Hook ====================

export const useUnsaveFromProfile = (options: UseUnsaveFromProfileOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: async ({ pinId, shouldDelete }: { pinId: string; shouldDelete: boolean }) => {
      if (shouldDelete) {
        await pinApi.delete(pinId);
        return { deleted: true, pinId };
      } else {
        await pinApi.unsaveFromProfile(pinId);
        return { deleted: false, pinId };
      }
    },

    onMutate: async ({ pinId, shouldDelete }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      const previousPin = findPinInCache(queryClient, pinId);

      const previousLists: Array<{ key: QueryKey; data: InfiniteData<PagePinResponse> | undefined }> = [];
      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({ queryKey: queryKeys.pins.all })
        .forEach(([key, data]) => { if (data) previousLists.push({ key, data }); });

      if (shouldDelete) {
        queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
          { queryKey: queryKeys.pins.all },
          (oldData) => removePinFromPages(oldData, pinId)
        );
      } else {
        if (previousPin) {
          queryClient.setQueryData<PinResponse>(
            queryKeys.pins.byId(pinId),
            createUnsavedFromProfilePin(previousPin)
          );
        }

        queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
          { queryKey: queryKeys.pins.all },
          (oldData) => updatePinInPages(oldData, pinId, createUnsavedFromProfilePin)
        );

        if (previousPin?.savedToBoardCount === 0 && userId) {
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

      return { previousPin, previousLists, pinId, shouldDelete };
    },

    onSuccess: (result) => {
      const { deleted, pinId } = result;

      if (deleted) {
        queryClient.removeQueries({ queryKey: queryKeys.pins.byId(pinId) });
        if (showToast) toast.success('Pin deleted');
      } else {
        if (userId) {
          queryClient.invalidateQueries({
            predicate: (query) => isSavedPinsQuery(query.queryKey, userId),
          });
        }
        if (showToast) toast.success('Removed from profile');
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

  const unsaveFromProfile = (pinId: string) => {
    const pin = findPinInCache(queryClient, pinId);
    const shouldDelete = shouldDeleteAfterProfileRemoval(pin, userId);
    mutation.mutate({ pinId, shouldDelete });
  };

  const unsaveFromProfileAsync = async (pinId: string) => {
    const pin = findPinInCache(queryClient, pinId);
    const shouldDelete = shouldDeleteAfterProfileRemoval(pin, userId);
    return mutation.mutateAsync({ pinId, shouldDelete });
  };

  return {
    unsaveFromProfile,
    unsaveFromProfileAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useUnsaveFromProfile;