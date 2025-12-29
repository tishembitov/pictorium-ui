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

// ==================== Logging ====================

const LOG_PREFIX = '[UnsaveFromProfile]';

const logPinState = (label: string, pin: PinResponse | undefined) => {
  if (!pin) {
    console.log(`${LOG_PREFIX} ${label}: pin is undefined`);
    return;
  }
  console.log(`${LOG_PREFIX} ${label}:`, {
    id: pin.id,
    userId: pin.userId,
    isSaved: pin.isSaved,
    isSavedToProfile: pin.isSavedToProfile,
    savedToBoardCount: pin.savedToBoardCount,
    savedToBoardName: pin.savedToBoardName,
  });
};

const logDecision = (decision: string, reason: string, details?: Record<string, unknown>) => {
  console.log(`${LOG_PREFIX} DECISION: ${decision}`);
  console.log(`${LOG_PREFIX} Reason: ${reason}`);
  if (details) {
    console.log(`${LOG_PREFIX} Details:`, details);
  }
};

const logCacheUpdate = (action: string, details?: Record<string, unknown>) => {
  console.log(`${LOG_PREFIX} Cache Update - ${action}`, details || '');
};

// ==================== Helper: Find Pin in Cache ====================

const findPinInCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  pinId: string
): PinResponse | undefined => {
  // Try single pin cache first
  const singlePin = queryClient.getQueryData<PinResponse>(queryKeys.pins.byId(pinId));
  if (singlePin) {
    console.log(`${LOG_PREFIX} Found pin in single cache`);
    return singlePin;
  }

  // Search in lists
  console.log(`${LOG_PREFIX} Searching pin in lists...`);
  const allQueries = queryClient.getQueriesData<InfiniteData<PagePinResponse>>({
    queryKey: queryKeys.pins.all,
  });

  for (const [key, data] of allQueries) {
    if (!data?.pages) continue;
    
    for (const page of data.pages) {
      const found = page.content.find((p) => p.id === pinId);
      if (found) {
        console.log(`${LOG_PREFIX} Found pin in list:`, JSON.stringify(key).slice(0, 100));
        return found;
      }
    }
  }

  console.log(`${LOG_PREFIX} Pin NOT found in any cache!`);
  return undefined;
};

// ==================== Helpers ====================

const createUnsavedFromProfilePin = (pin: PinResponse): PinResponse => {
  const updated = {
    ...pin,
    isSavedToProfile: false,
    isSaved: pin.savedToBoardCount > 0,
  };
  logPinState('After unsave update', updated);
  return updated;
};

const updatePinInPages = (
  data: InfiniteData<PagePinResponse> | undefined,
  pinId: string,
  updater: (pin: PinResponse) => PinResponse
): InfiniteData<PagePinResponse> | undefined => {
  if (!data?.pages) return data;
  
  let updateCount = 0;
  const result = {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      content: page.content.map((pin) => {
        if (pin.id === pinId) {
          updateCount++;
          return updater(pin);
        }
        return pin;
      }),
    })),
  };
  
  logCacheUpdate('updatePinInPages', { pinId, updateCount });
  return result;
};

const removePinFromPages = (
  data: InfiniteData<PagePinResponse> | undefined,
  pinId: string
): InfiniteData<PagePinResponse> | undefined => {
  if (!data?.pages) return data;
  
  let removedCount = 0;
  const result = {
    ...data,
    pages: data.pages.map((page) => {
      const filteredContent = page.content.filter((pin) => {
        if (pin.id === pinId) { 
          removedCount++; 
          return false; 
        }
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
  
  logCacheUpdate('removePinFromPages', { pinId, removedCount });
  return result;
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
    // ✅ mutationFn получает решение из параметров
    mutationFn: async ({ pinId, shouldDelete }: { pinId: string; shouldDelete: boolean }) => {
      console.log(`${LOG_PREFIX} ========================================`);
      console.log(`${LOG_PREFIX} Executing API call`);
      console.log(`${LOG_PREFIX} Pin ID: ${pinId}`);
      console.log(`${LOG_PREFIX} Should delete (from pre-mutation): ${shouldDelete}`);
      
      if (shouldDelete) {
        logDecision('DELETE PIN', 'Decision from pre-mutation', { shouldDelete });
        await pinApi.delete(pinId);
        return { deleted: true, pinId };
      } else {
        logDecision('UNSAVE ONLY', 'Decision from pre-mutation', { shouldDelete });
        await pinApi.unsaveFromProfile(pinId);
        return { deleted: false, pinId };
      }
    },
    
    onMutate: async ({ pinId, shouldDelete }) => {
      console.log(`${LOG_PREFIX} onMutate - Starting`);
      console.log(`${LOG_PREFIX} Pin ID: ${pinId}`);
      console.log(`${LOG_PREFIX} Should delete: ${shouldDelete}`);
      
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      // Найти пин для rollback
      const previousPin = findPinInCache(queryClient, pinId);
      logPinState('Previous pin state', previousPin);

      // Сохранить состояние для rollback
      const previousLists: Array<{ key: QueryKey; data: InfiniteData<PagePinResponse> | undefined }> = [];
      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({ queryKey: queryKeys.pins.all })
        .forEach(([key, data]) => { if (data) previousLists.push({ key, data }); });
      
      console.log(`${LOG_PREFIX} Saved ${previousLists.length} list snapshots for rollback`);

      // Оптимистичное обновление
      if (shouldDelete) {
        console.log(`${LOG_PREFIX} Optimistic: Removing pin from ALL lists`);
        queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
          { queryKey: queryKeys.pins.all },
          (oldData) => removePinFromPages(oldData, pinId)
        );
      } else {
        console.log(`${LOG_PREFIX} Optimistic: Updating pin state only`);
        
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

        // Remove from saved queries if no longer saved anywhere
        if (previousPin?.savedToBoardCount === 0 && userId) {
          console.log(`${LOG_PREFIX} Pin has no board saves - removing from saved queries`);
          queryClient.getQueriesData<InfiniteData<PagePinResponse>>({ queryKey: queryKeys.pins.all })
            .forEach(([key]) => {
              if (isSavedPinsQuery(key, userId)) {
                console.log(`${LOG_PREFIX} Removing from query:`, JSON.stringify(key).slice(0, 100));
                queryClient.setQueryData<InfiniteData<PagePinResponse>>(
                  key, (oldData) => removePinFromPages(oldData, pinId)
                );
              }
            });
        }
      }

      console.log(`${LOG_PREFIX} onMutate - Complete`);
      return { previousPin, previousLists, pinId, shouldDelete };
    },

    onSuccess: (result) => {
      const { deleted, pinId } = result;
      console.log(`${LOG_PREFIX} onSuccess - Result:`, result);
      
      if (deleted) {
        console.log(`${LOG_PREFIX} Pin was deleted - removing from cache`);
        queryClient.removeQueries({ queryKey: queryKeys.pins.byId(pinId) });
        logCacheUpdate('Removed pin from cache');
        if (showToast) toast.success('Pin deleted');
      } else {
        console.log(`${LOG_PREFIX} Pin was unsaved - invalidating queries`);
        if (userId) {
          queryClient.invalidateQueries({
            predicate: (query) => isSavedPinsQuery(query.queryKey, userId),
          });
        }
        if (showToast) toast.success('Removed from profile');
      }
      
      console.log(`${LOG_PREFIX} ========================================`);
      onSuccess?.();
    },

    onError: (error: Error, { pinId }, context) => {
      console.error(`${LOG_PREFIX} onError - Rolling back`, error.message);
      
      if (context?.previousPin) {
        queryClient.setQueryData(queryKeys.pins.byId(pinId), context.previousPin);
        logCacheUpdate('Rolled back single pin');
      }
      if (context?.previousLists) {
        for (const { key, data } of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
        logCacheUpdate('Rolled back all lists', { count: context.previousLists.length });
      }
      
      if (showToast) toast.error(error.message || 'Failed to remove pin');
      console.log(`${LOG_PREFIX} ========================================`);
      onError?.(error);
    },
  });

  // ✅ Обёртка: принимаем решение синхронно перед мутацией
  const unsaveFromProfile = (pinId: string) => {
    const pin = findPinInCache(queryClient, pinId);
    const shouldDelete = shouldDeleteAfterProfileRemoval(pin, userId);
    
    console.log(`${LOG_PREFIX} Pre-mutation decision: shouldDelete=${shouldDelete}`);
    
    mutation.mutate({ pinId, shouldDelete });
  };

  const unsaveFromProfileAsync = async (pinId: string) => {
    const pin = findPinInCache(queryClient, pinId);
    const shouldDelete = shouldDeleteAfterProfileRemoval(pin, userId);
    
    console.log(`${LOG_PREFIX} Pre-mutation decision: shouldDelete=${shouldDelete}`);
    
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