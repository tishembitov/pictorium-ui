// src/modules/pin/hooks/useUnlikePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinLikeApi } from '../api/pinLikeApi';
import type { PinResponse } from '../types/pin.types';

interface UseUnlikePinOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to unlike a pin with optimistic update
 */
export const useUnlikePin = (options: UseUnlikePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinLikeApi.unlike(pinId),
    onMutate: async (pinId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });

      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      if (previousPin) {
        queryClient.setQueryData<PinResponse>(queryKeys.pins.byId(pinId), {
          ...previousPin,
          isLiked: false,
          likeCount: Math.max(0, previousPin.likeCount - 1),
        });
      }

      return { previousPin };
    },
    onSuccess: (_, pinId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.likes(pinId) });
      onSuccess?.();
    },
    onError: (error: Error, pinId, context) => {
      if (context?.previousPin) {
        queryClient.setQueryData(queryKeys.pins.byId(pinId), context.previousPin);
      }
      onError?.(error);
    },
  });

  return {
    unlikePin: mutation.mutate,
    unlikePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useUnlikePin;