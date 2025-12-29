// src/modules/pin/hooks/useSaveToProfile.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import type { PinResponse, PagePinResponse } from '../types/pin.types';

interface UseSaveToProfileOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

// ==================== Logging ====================

const LOG_PREFIX = '[SaveToProfile]';

const logPinState = (label: string, pin: PinResponse | undefined) => {
  if (!pin) {
    console.log(`${LOG_PREFIX} ${label}: pin is undefined`);
    return;
  }
  console.log(`${LOG_PREFIX} ${label}:`, {
    id: pin.id,
    isSaved: pin.isSaved,
    isSavedToProfile: pin.isSavedToProfile,
    savedToBoardCount: pin.savedToBoardCount,
  });
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
    return singlePin;
  }

  // Search in lists
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

const createSavedToProfilePin = (pin: PinResponse): PinResponse => ({
  ...pin,
  isSavedToProfile: true,
  isSaved: true,
});

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
  
  if (updateCount > 0) {
    logCacheUpdate('updatePinInPages', { pinId, updateCount });
  }
  return result;
};

const isSavedPinsQuery = (queryKey: QueryKey, userId: string): boolean => {
  if (!Array.isArray(queryKey) || queryKey[0] !== 'pins' || queryKey[1] !== 'list') return false;
  const filter = queryKey[2] as Record<string, unknown> | undefined;
  return filter?.savedAnywhere === userId || filter?.savedToProfileBy === userId;
};

// ==================== Hook ====================

export const useSaveToProfile = (options: UseSaveToProfileOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: (pinId: string) => {
      console.log(`${LOG_PREFIX} ========================================`);
      console.log(`${LOG_PREFIX} Executing API call for pin: ${pinId}`);
      return pinApi.saveToProfile(pinId);
    },

    onMutate: async (pinId) => {
      console.log(`${LOG_PREFIX} onMutate - Starting for pin: ${pinId}`);
      
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      // ✅ Ищем пин в кэше (включая списки)
      const previousPin = findPinInCache(queryClient, pinId);
      logPinState('Previous state', previousPin);

      // Сохраняем для rollback
      const previousLists: Array<{
        key: QueryKey;
        data: InfiniteData<PagePinResponse> | undefined;
      }> = [];

      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({
        queryKey: queryKeys.pins.all,
      }).forEach(([key, data]) => {
        if (data) previousLists.push({ key, data });
      });

      // Оптимистичное обновление
      if (previousPin) {
        const updatedPin = createSavedToProfilePin(previousPin);
        logPinState('Optimistic update', updatedPin);
        
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          updatedPin
        );
      }

      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, createSavedToProfilePin)
      );

      console.log(`${LOG_PREFIX} onMutate - Complete`);
      return { previousPin, previousLists, pinId };
    },

    onSuccess: (data, pinId) => {
      console.log(`${LOG_PREFIX} onSuccess`);
      logPinState('Server response', data);

      // Обновляем кэш данными сервера
      queryClient.setQueryData(queryKeys.pins.byId(pinId), data);
      
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, () => data)
      );

      // Инвалидируем saved queries
      if (userId) {
        queryClient.invalidateQueries({
          predicate: (query) => isSavedPinsQuery(query.queryKey, userId),
        });
      }

      if (showToast) {
        toast.success('Saved to your profile!');
      }

      console.log(`${LOG_PREFIX} ========================================`);
      onSuccess?.(data);
    },

    onError: (error: Error, pinId, context) => {
      console.error(`${LOG_PREFIX} onError - Rolling back`, error.message);

      if (context?.previousPin) {
        queryClient.setQueryData(queryKeys.pins.byId(pinId), context.previousPin);
      }

      if (context?.previousLists) {
        for (const { key, data } of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }

      if (showToast) {
        toast.error(error.message || 'Failed to save pin');
      }

      console.log(`${LOG_PREFIX} ========================================`);
      onError?.(error);
    },
  });

  return {
    saveToProfile: mutation.mutate,
    saveToProfileAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useSaveToProfile;