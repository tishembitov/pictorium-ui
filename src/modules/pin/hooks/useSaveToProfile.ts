// src/modules/pin/hooks/useSaveToProfile.ts

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
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

/**
 * Helper to create updated pin with saved to profile status
 */
const createSavedToProfilePin = (pin: PinResponse): PinResponse => ({
  ...pin,
  isSavedToProfile: true,
  isSaved: true,
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
 * Hook to save a pin to profile (without board)
 */
export const useSaveToProfile = (options: UseSaveToProfileOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinApi.saveToProfile(pinId),
    
    onMutate: async (pinId) => {
      // Cancel related queries
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      // Snapshot previous data
      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      // Optimistic update for single pin
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          createSavedToProfilePin(previousPin)
        );
      }

      // Optimistic update for all pin lists
      queryClient.setQueriesData<InfiniteData<PagePinResponse>>(
        { queryKey: queryKeys.pins.all },
        (oldData) => updatePinInPages(oldData, pinId, createSavedToProfilePin)
      );

      return { previousPin, pinId };
    },

    onSuccess: (data, pinId) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.pins.byId(pinId), data);
      
      // Invalidate user's saved pins queries to refresh counts
      if (userId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.pins.mySavedToProfile() 
        });
        // Invalidate savedAnywhere queries for the user
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            if (!Array.isArray(key) || key[0] !== 'pins' || key[1] !== 'list') return false;
            const filter = key[2] as Record<string, unknown> | undefined;
            return filter?.savedAnywhere === userId || filter?.savedToProfileBy === userId;
          },
        });
      }

      if (showToast) {
        toast.success('Saved to your profile!');
      }

      onSuccess?.(data);
    },

    onError: (error: Error, pinId, context) => {
      // Rollback
      if (context?.previousPin) {
        queryClient.setQueryData(
          queryKeys.pins.byId(pinId),
          context.previousPin
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });

      if (showToast) {
        toast.error(error.message || 'Failed to save pin');
      }

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