// src/modules/pin/hooks/useUnsavePin.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { savedPinApi } from '../api/savedPinApi';
import { useAuthStore } from '@/modules/auth';
import type { PinResponse, PagePinResponse } from '../types/pin.types';

interface UseUnsavePinOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const createPinUpdater = (pinId: string, updates: Partial<PinResponse>) => {
  return (pin: PinResponse): PinResponse => {
    if (pin.id !== pinId) return pin;
    return { ...pin, ...updates };
  };
};

/**
 * Helper to check if query key matches savedBy filter for specific user
 */
const isSavedByUserQuery = (queryKey: QueryKey, userId: string): boolean => {
  if (!Array.isArray(queryKey) || queryKey.length < 3) return false;
  const filter = queryKey[2];
  return (
    queryKey[0] === 'pins' &&
    queryKey[1] === 'list' &&
    typeof filter === 'object' &&
    filter !== null &&
    (filter as Record<string, unknown>).savedBy === userId
  );
};

/**
 * Helper to remove pin from infinite data and update totalElements
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

export const useUnsavePin = (options: UseUnsavePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: (pinId: string) => savedPinApi.unsave(pinId),
    onMutate: async (pinId) => {
      // Cancel related queries
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      // Save previous data for rollback
      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );
      
      // Collect all savedBy queries for this user
      const previousSavedQueries: Array<{
        key: QueryKey;
        data: InfiniteData<PagePinResponse> | undefined;
      }> = [];
      
      if (userId) {
        queryClient.getQueriesData<InfiniteData<PagePinResponse>>({
          queryKey: queryKeys.pins.all,
        }).forEach(([key, data]) => {
          if (isSavedByUserQuery(key, userId)) {
            previousSavedQueries.push({ key, data });
          }
        });
      }

      // Calculate updates
      const currentSaveCount = previousPin?.saveCount ?? 1;
      const updates = {
        isSaved: false,
        saveCount: Math.max(0, currentSaveCount - 1),
      };
      const updatePin = createPinUpdater(pinId, updates);

      // 1. Update single pin cache
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          updatePin(previousPin)
        );
      }

      // 2. Update isSaved flag in ALL pin lists
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              content: page.content.map(updatePin),
            })),
          };
        }
      );

      // 3. Remove pin from savedBy queries (optimistic removal)
      for (const { key } of previousSavedQueries) {
        queryClient.setQueryData<InfiniteData<PagePinResponse>>(
          key,
          (oldData) => removePinFromPages(oldData, pinId)
        );
      }

      return { previousPin, previousSavedQueries, pinId };
    },
    onSuccess: () => {
      // ✅ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Инвалидировать ВСЕ savedBy queries 
      // для текущего пользователя БЕЗ refetchType: 'none'
      if (userId) {
        queryClient.invalidateQueries({
          predicate: (query) => isSavedByUserQuery(query.queryKey, userId),
        });
        
        // Also invalidate the saved pins shortcut query
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.pins.saved(userId),
        });
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
      
      // Rollback savedBy queries
      if (context?.previousSavedQueries) {
        for (const { key, data } of context.previousSavedQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      
      // Refetch all pin lists
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });
      
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