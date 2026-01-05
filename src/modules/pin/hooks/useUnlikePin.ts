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

    onSuccess: (updatedPin, pinId) => {
      // Обновляем кэш конкретного пина
      queryClient.setQueryData(
        queryKeys.pins.byId(pinId), 
        updatedPin
      );
      
      // Инвалидация списка лайков пина
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.likes(pinId),
        refetchType: 'none',
      });

      // ✅ Инвалидируем списки (для обновления likeCount в гридах)
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });
      
      onSuccess?.(updatedPin);
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

export default useUnlikePin;