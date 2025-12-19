// src/modules/pin/hooks/useLikePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinLikeApi } from '../api/pinLikeApi';
import type { PinResponse, PagePinResponse } from '../types/pin.types';
import type { InfiniteData } from '@tanstack/react-query';

interface UseLikePinOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Helper to update pin in any data structure
 */
const createPinUpdater = (pinId: string, updates: Partial<PinResponse>) => {
  return (pin: PinResponse): PinResponse => {
    if (pin.id !== pinId) return pin;
    return { ...pin, ...updates };
  };
};

/**
 * Hook to like a pin with optimistic update
 */
export const useLikePin = (options: UseLikePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinLikeApi.like(pinId),
    onMutate: async (pinId) => {
      // Cancel all related queries
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      // Get previous pin for rollback
      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      // Calculate new values
      const currentLikeCount = previousPin?.likeCount ?? 0;
      const updates = {
        isLiked: true,
        likeCount: currentLikeCount + 1,
      };

      const updatePin = createPinUpdater(pinId, updates);

      // 1. Update single pin cache (for PinDetail page)
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          updatePin(previousPin)
        );
      }

      // 2. Update all infinite pin lists (for PinGrid)
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

      return { previousPin, pinId };
    },
    onSuccess: (data, pinId) => {
      // Only invalidate likes list, not the pin itself
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.likes(pinId),
        exact: true,
      });
      onSuccess?.(data);
    },
    onError: (error: Error, pinId, context) => {
      // Rollback single pin
      if (context?.previousPin) {
        queryClient.setQueryData(
          queryKeys.pins.byId(pinId), 
          context.previousPin
        );
      }

      // Rollback lists by refetching
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });

      onError?.(error);
    },
  });

  return {
    likePin: mutation.mutate,
    likePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useLikePin;