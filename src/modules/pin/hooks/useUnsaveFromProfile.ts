// src/modules/pin/hooks/useUnsaveFromProfile.ts

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
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
 * Helper to remove pin from saved to profile pages
 */
const removePinFromSavedPages = (
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
 * Hook to unsave a pin from profile
 */
export const useUnsaveFromProfile = (options: UseUnsaveFromProfileOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinApi.unsaveFromProfile(pinId),
    
    onMutate: async (pinId) => {
      // Cancel related queries
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.mySavedToProfile() });

      // Snapshot previous data
      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      const previousSavedPins = queryClient.getQueryData<InfiniteData<PagePinResponse>>(
        [...queryKeys.pins.mySavedToProfile(), 'infinite']
      );

      // Optimistic update for single pin
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          createUnsavedFromProfilePin(previousPin)
        );
      }

      // Optimistic update for all pin lists
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, createUnsavedFromProfilePin)
      );

      // Remove from saved to profile list
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.mySavedToProfile() },
        (oldData) => removePinFromSavedPages(oldData, pinId)
      );

      return { previousPin, previousSavedPins, pinId };
    },

    onSuccess: () => {
      // Invalidate saved to profile queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.mySavedToProfile() 
      });

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
      
      // Rollback saved pins list
      if (context?.previousSavedPins) {
        queryClient.setQueryData(
          [...queryKeys.pins.mySavedToProfile(), 'infinite'],
          context.previousSavedPins
        );
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