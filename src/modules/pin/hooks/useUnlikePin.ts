// src/modules/pin/hooks/useUnlikePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinLikeApi } from '../api/pinLikeApi';
import type { PinResponse, PagePinResponse } from '../types/pin.types';
import type { InfiniteData } from '@tanstack/react-query';

interface UseUnlikePinOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const createPinUpdater = (pinId: string, updates: Partial<PinResponse>) => {
  return (pin: PinResponse): PinResponse => {
    if (pin.id !== pinId) return pin;
    return { ...pin, ...updates };
  };
};

export const useUnlikePin = (options: UseUnlikePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinLikeApi.unlike(pinId),
    onMutate: async (pinId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      const currentLikeCount = previousPin?.likeCount ?? 1;
      const updates = {
        isLiked: false,
        likeCount: Math.max(0, currentLikeCount - 1),
      };

      const updatePin = createPinUpdater(pinId, updates);

      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          updatePin(previousPin)
        );
      }

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
    onSuccess: (_, pinId) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.likes(pinId),
        exact: true,
      });
      onSuccess?.();
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
    unlikePin: mutation.mutate,
    unlikePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useUnlikePin;