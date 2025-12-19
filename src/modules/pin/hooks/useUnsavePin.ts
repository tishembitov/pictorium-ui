// src/modules/pin/hooks/useUnsavePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { savedPinApi } from '../api/savedPinApi';
import { useAuthStore } from '@/modules/auth';
import type { PinResponse, PagePinResponse } from '../types/pin.types';
import type { InfiniteData } from '@tanstack/react-query';

interface UseUnsavePinOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const createPinUpdater = (pinId: string, updates: Partial<PinResponse>) => {
  return (pin: PinResponse): PinResponse => {
    if (pin.id !== pinId) return pin;
    return { ...pin, ...updates };
  };
};

export const useUnsavePin = (options: UseUnsavePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: (pinId: string) => savedPinApi.unsave(pinId),
    onMutate: async (pinId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.all });

      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      const currentSaveCount = previousPin?.saveCount ?? 1;
      const updates = {
        isSaved: false,
        saveCount: Math.max(0, currentSaveCount - 1),
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
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.pins.saved(userId),
          exact: true,
        });
      }

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
    unsavePin: mutation.mutate,
    unsavePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useUnsavePin;