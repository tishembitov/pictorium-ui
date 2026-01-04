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
 * Простая мутация для лайка пина.
 * UI обновляется через usePinLikeState в компоненте.
 */
export const useLikePin = (options: UseLikePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinLikeApi.like(pinId),

    onSuccess: (data, pinId) => {
      // Фоновая инвалидация
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.likes(pinId),
        refetchType: 'none',
      });
      onSuccess?.(data);
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    likePin: mutation.mutate,
    likePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};