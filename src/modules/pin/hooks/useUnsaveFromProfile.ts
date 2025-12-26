// src/modules/pin/hooks/useUnsaveFromProfile.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import type { PinResponse, PagePinResponse } from '../types/pin.types';

interface UseUnsaveFromProfileOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Helper to create updated pin with unsaved from profile status
 */
const createUnsavedFromProfilePin = (pin: PinResponse): PinResponse => ({
  ...pin,
  isSavedToProfile: false,
  // isSaved остаётся true если пин сохранён в доску
});

/**
 * Helper to update pin in pages
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
 * Helper to remove pin from pages and update counts
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
  return filter?.savedAnywhere === userId || filter?.savedToProfileBy === userId;
};

/**
 * Hook to unsave a pin from profile
 */
export const useUnsaveFromProfile = (options: UseUnsaveFromProfileOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinApi.unsaveFromProfile(pinId),
    
    onMutate: async (pinId) => {
      // Cancel related queries
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      // Snapshot previous data
      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      // Collect saved pins queries for rollback
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
          createUnsavedFromProfilePin(previousPin)
        );
      }

      // Optimistic update for all pin lists (update flags)
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, createUnsavedFromProfilePin)
      );

      // Remove from saved pins queries (optimistic removal)
      if (userId) {
        for (const { key } of previousSavedQueries) {
          queryClient.setQueryData<InfiniteData<PagePinResponse>>(
            key,
            (oldData) => removePinFromPages(oldData, pinId)
          );
        }
      }

      return { previousPin, previousSavedQueries, pinId };
    },

    onSuccess: () => {
      // Invalidate saved pins queries for fresh data
      if (userId) {
        queryClient.invalidateQueries({
          predicate: (query) => isSavedPinsQuery(query.queryKey, userId),
        });
      }

      if (showToast) {
        toast.success('Removed from profile');
      }

      onSuccess?.();
    },

    onError: (error: Error, pinId, context) => {
      // Rollback single pin
      if (context?.previousPin) {
        queryClient.setQueryData(
          queryKeys.pins.byId(pinId),
          context.previousPin
        );
      }
      
      // Rollback saved pins queries
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
    unsaveFromProfile: mutation.mutate,
    unsaveFromProfileAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useUnsaveFromProfile;