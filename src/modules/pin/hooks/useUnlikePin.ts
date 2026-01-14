// src/modules/pin/hooks/useUnlikePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinLikeApi } from '../api/pinLikeApi';
import type { PinResponse } from '../types/pin.types';

interface UseUnlikePinOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
}

export const useUnlikePin = (options: UseUnlikePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinLikeApi.unlike(pinId),

    // ✅ Добавлен optimistic update в кэше
    onMutate: async (pinId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });

      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      // Optimistic update
      if (previousPin) {
        queryClient.setQueryData<PinResponse>(
          queryKeys.pins.byId(pinId),
          {
            ...previousPin,
            isLiked: false,
            likeCount: Math.max(0, previousPin.likeCount - 1),
          }
        );
      }

      return { previousPin };
    },

    onSuccess: (updatedPin, pinId) => {
      // Обновляем кэш данными от сервера
      queryClient.setQueryData(queryKeys.pins.byId(pinId), updatedPin);

      // Фоновая инвалидация
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pins.likes(pinId),
        refetchType: 'none',
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });

      onSuccess?.(updatedPin);
    },

    onError: (error: Error, pinId, context) => {
      // Rollback кэша
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
  };
};

export default useUnlikePin;