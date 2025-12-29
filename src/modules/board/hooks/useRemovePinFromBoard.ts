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

// ==================== Logging ====================

const LOG_PREFIX = '[RemovePinFromBoard]';

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

const createUnsavedPin = (pin: PinResponse): PinResponse => {
  const newSavedCount = Math.max(0, pin.savedToBoardCount - 1);
  const updated = {
    ...pin,
    isSaved: newSavedCount > 0 || pin.isSavedToProfile,
    savedToBoardCount: newSavedCount,
    savedToBoardName: newSavedCount === 0 ? null : pin.savedToBoardName,
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
  return filter?.savedAnywhere === userId || filter?.savedBy === userId || filter?.savedToProfileBy === userId;
};

// ==================== Context Type ====================

// ==================== Hook ====================

export const useRemovePinFromBoard = (options: UseRemovePinFromBoardOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    // ✅ mutationFn теперь получает решение из контекста
    mutationFn: async ({ 
      boardId, 
      pinId, 
      shouldDelete 
    }: BoardPinAction & { shouldDelete: boolean }) => {
      console.log(`${LOG_PREFIX} ========================================`);
      console.log(`${LOG_PREFIX} Executing API call`);
      console.log(`${LOG_PREFIX} Pin ID: ${pinId}`);
      console.log(`${LOG_PREFIX} Board ID: ${boardId}`);
      console.log(`${LOG_PREFIX} Should delete (from onMutate): ${shouldDelete}`);
      
      if (shouldDelete) {
        logDecision('DELETE PIN', 'Decision from onMutate');
        await pinApi.delete(pinId);
        return { deleted: true, pinId, boardId };
      } else {
        logDecision('REMOVE FROM BOARD ONLY', 'Decision from onMutate');
        await boardApi.removePinFromBoard(boardId, pinId);
        return { deleted: false, pinId, boardId };
      }
    },
    
    onMutate: async ({ boardId, pinId }) => {
      console.log(`${LOG_PREFIX} onMutate - Starting`);
      console.log(`${LOG_PREFIX} Pin ID: ${pinId}`);
      console.log(`${LOG_PREFIX} Board ID: ${boardId}`);
      console.log(`${LOG_PREFIX} Current user: ${userId}`);
      
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.boards.pins(boardId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      // ✅ Найти пин ПЕРЕД любыми изменениями
      const previousPin = findPinInCache(queryClient, pinId);
      logPinState('Previous pin state', previousPin);
      
      // ✅ Принять решение ЗДЕСЬ, пока пин ещё в кэше
      const shouldDelete = shouldDeleteAfterBoardRemoval(previousPin, userId);
      console.log(`${LOG_PREFIX} Decision made - Will delete: ${shouldDelete}`);

      // Сохранить состояние для rollback
      const previousLists: Array<{ key: QueryKey; data: InfiniteData<PagePinResponse> | undefined }> = [];
      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({ queryKey: queryKeys.pins.all })
        .forEach(([key, data]) => { if (data) previousLists.push({ key, data }); });
      
      console.log(`${LOG_PREFIX} Saved ${previousLists.length} list snapshots`);

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
          queryClient.setQueryData<PinResponse>(queryKeys.pins.byId(pinId), createUnsavedPin(previousPin));
        }
        
        queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
          { queryKey: queryKeys.pins.all },
          (oldData) => updatePinInPages(oldData, pinId, createUnsavedPin)
        );

        // Remove from saved queries if no longer saved anywhere
        if (previousPin && previousPin.savedToBoardCount <= 1 && !previousPin.isSavedToProfile && userId) {
          console.log(`${LOG_PREFIX} Pin will have no saves - removing from saved queries`);
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

      console.log(`${LOG_PREFIX} onMutate - Complete`);
      
      // ✅ Возвращаем контекст включая решение
      return { previousPin, previousLists, pinId, boardId, shouldDelete };
    },

    onSuccess: (result) => {
      const { deleted, pinId, boardId } = result;
      console.log(`${LOG_PREFIX} onSuccess - Result:`, result);
      
      if (deleted) {
        console.log(`${LOG_PREFIX} Pin was deleted - removing from cache`);
        queryClient.removeQueries({ queryKey: queryKeys.pins.byId(pinId) });
        logCacheUpdate('Removed pin from cache');
        if (showToast) toast.success('Pin deleted');
      } else {
        console.log(`${LOG_PREFIX} Pin was removed from board - invalidating queries`);
        if (showToast) toast.success('Pin removed from board');
      }

      // ✅ Всегда инвалидируем доски (независимо от deleted)
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.forPin(pinId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.pins(boardId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.my() }); // ✅ Обновит pinCount

      // ✅ Инвалидируем пины ВСЕХ досок для обновления превью
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'boards' && key[1] === 'pins';
        }
      });

      if (userId) {
        queryClient.invalidateQueries({
          predicate: (query) => isSavedPinsQuery(query.queryKey, userId),
        });
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

  // ✅ Обёртка чтобы добавить shouldDelete в вызов
  const removePinFromBoard = ({ boardId, pinId }: BoardPinAction) => {
    // Находим пин и принимаем решение синхронно перед мутацией
    const pin = findPinInCache(queryClient, pinId);
    const shouldDelete = shouldDeleteAfterBoardRemoval(pin, userId);
    
    console.log(`${LOG_PREFIX} Pre-mutation decision: shouldDelete=${shouldDelete}`);
    
    mutation.mutate({ boardId, pinId, shouldDelete });
  };

  return {
    removePinFromBoard,
    removePinFromBoardAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useRemovePinFromBoard;