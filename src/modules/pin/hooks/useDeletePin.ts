// src/modules/pin/hooks/useDeletePin.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import { ROUTES } from '@/app/router/routeConfig';
import type { PagePinResponse } from '../types/pin.types';

interface UseDeletePinOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  navigateOnSuccess?: boolean;
}

/**
 * Removes pin from pages and updates counts
 */
const removePinFromPages = (
  data: InfiniteData<PagePinResponse> | undefined,
  pinId: string
): InfiniteData<PagePinResponse> | undefined => {
  if (!data?.pages) return data;
  
  let removedCount = 0;
  
  return {
    ...data,
    pages: data.pages.map((page) => {
      const filtered = page.content.filter((p) => {
        if (p.id === pinId) {
          removedCount++;
          return false;
        }
        return true;
      });
      
      return {
        ...page,
        content: filtered,
        totalElements: page.totalElements - removedCount,
        numberOfElements: filtered.length,
      };
    }),
  };
};

/**
 * Hook to delete a pin
 */
export const useDeletePin = (options: UseDeletePinOptions = {}) => {
  const { 
    onSuccess, 
    onError, 
    showToast = true,
    navigateOnSuccess = true,
  } = options;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinApi.delete(pinId),
    
    onMutate: async (pinId) => {
      // Cancel all pin list queries
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      // Snapshot ALL pin lists for rollback
      const previousLists: Array<{
        key: QueryKey;
        data: InfiniteData<PagePinResponse> | undefined;
      }> = [];

      queryClient.getQueriesData<InfiniteData<PagePinResponse>>({
        queryKey: queryKeys.pins.all,
      }).forEach(([key, data]) => {
        if (data) {
          previousLists.push({ key, data });
        }
      });

      // Optimistic removal from all lists
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => removePinFromPages(oldData, pinId)
      );

      return { previousLists, pinId };
    },

    onSuccess: (_, pinId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.pins.byId(pinId) });
      
      if (showToast) {
        toast.success(SUCCESS_MESSAGES.PIN_DELETED);
      }
      
      if (navigateOnSuccess) {
        navigate(ROUTES.HOME);
      }
      
      onSuccess?.();
    },

    onError: (error: Error, _, context) => {
      // Rollback ALL lists
      if (context?.previousLists) {
        for (const { key, data } of context.previousLists) {
          queryClient.setQueryData(key, data);
        }
      }
      
      if (showToast) {
        toast.error(error.message || 'Failed to delete pin');
      }
      
      onError?.(error);
    },
  });

  return {
    deletePin: mutation.mutate,
    deletePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useDeletePin;