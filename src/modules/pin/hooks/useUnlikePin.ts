// src/modules/pin/hooks/useUnlikePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinLikeApi } from '../api/pinLikeApi';

interface UseUnlikePinOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Простая мутация для анлайка пина.
 */
export const useUnlikePin = (options: UseUnlikePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinLikeApi.unlike(pinId),

    onSuccess: (_, pinId) => {
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.likes(pinId),
        refetchType: 'none',
      });
      onSuccess?.();
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    unlikePin: mutation.mutate,
    unlikePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};