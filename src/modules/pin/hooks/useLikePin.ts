// src/modules/pin/hooks/useLikePin.ts

import { useMutation, useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinLikeApi } from '../api/pinLikeApi';
import { useAuthStore } from '@/modules/auth';
import type { PinResponse, PagePinResponse } from '../types/pin.types';

interface UseLikePinOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
}

const createPinUpdater = (pinId: string, updates: Partial<PinResponse>) => {
  return (pin: PinResponse): PinResponse => {
    if (pin.id !== pinId) return pin;
    return { ...pin, ...updates };
  };
};

/**
 * Helper to check if query key matches likedBy filter for specific user
 */
const isLikedByUserQuery = (queryKey: QueryKey, userId: string): boolean => {
  if (!Array.isArray(queryKey) || queryKey.length < 3) return false;
  const filter = queryKey[2];
  return (
    queryKey[0] === 'pins' &&
    queryKey[1] === 'list' &&
    typeof filter === 'object' &&
    filter !== null &&
    (filter as Record<string, unknown>).likedBy === userId
  );
};

export const useLikePin = (options: UseLikePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinLikeApi.like(pinId),
    onMutate: async (pinId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      const currentLikeCount = previousPin?.likeCount ?? 0;
      const updates = {
        isLiked: true,
        likeCount: currentLikeCount + 1,
      };
      const updatePin = createPinUpdater(pinId, updates);

      // 1. Update single pin cache
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          updatePin(previousPin)
        );
      }

      // 2. Update isLiked flag in ALL pin lists
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
      // Invalidate likes list for the pin
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.likes(pinId),
        exact: true,
      });
      
      // Invalidate likedBy queries to ensure fresh data on tab switch
      if (userId) {
        queryClient.invalidateQueries({
          predicate: (query) => isLikedByUserQuery(query.queryKey, userId),
        });
      }
      
      onSuccess?.(data);
    },
    onError: (error: Error, pinId, context) => {
      if (context?.previousPin) {
        queryClient.setQueryData(
          queryKeys.pins.byId(pinId), 
          context.previousPin
        );
      }
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