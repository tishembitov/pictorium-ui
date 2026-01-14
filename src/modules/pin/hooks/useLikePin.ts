// src/modules/pin/hooks/useLikePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinLikeApi } from '../api/pinLikeApi';
import type { PinResponse } from '../types/pin.types';

interface UseLikePinOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
}

export const useLikePin = (options: UseLikePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinLikeApi.like(pinId),

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
            isLiked: true,
            likeCount: previousPin.likeCount + 1,
          }
        );
      }

      return { previousPin };
    },

    onSuccess: (updatedPin, pinId) => {
      // Обновляем кэш данными от сервера (источник истины)
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
    likePin: mutation.mutate,
    likePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export default useLikePin;