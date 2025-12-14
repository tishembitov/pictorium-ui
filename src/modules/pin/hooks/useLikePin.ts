// src/modules/pin/hooks/useLikePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinLikeApi } from '../api/pinLikeApi';
import type { PinResponse } from '../types/pin.types';

interface UseLikePinOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to like a pin with optimistic update
 */
export const useLikePin = (options: UseLikePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinLikeApi.like(pinId),
    onMutate: async (pinId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });

      // Get current pin
      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      // Optimistic update
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(queryKeys.pins.byId(pinId), {
          ...previousPin,
          isLiked: true,
          likeCount: previousPin.likeCount + 1,
        });
      }

      return { previousPin };
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(queryKeys.pins.byId(data.id), data);
      // Invalidate likes list
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.likes(data.id) });
      
      onSuccess?.(data);
    },
    onError: (error: Error, pinId, context) => {
      // Rollback optimistic update
      if (context?.previousPin) {
        queryClient.setQueryData(queryKeys.pins.byId(pinId), context.previousPin);
      }
      
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