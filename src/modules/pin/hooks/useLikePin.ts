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

    onSuccess: (updatedPin, pinId) => {
      // ✅ DEBUG: проверяем что приходит от сервера
      console.log('[useLikePin] Server response:', {
        pinId,
        isLiked: updatedPin.isLiked,
        likeCount: updatedPin.likeCount,
      });
      
      // ✅ DEBUG: проверяем что было в кэше до обновления
      const oldPin = queryClient.getQueryData<PinResponse>(queryKeys.pins.byId(pinId));
      console.log('[useLikePin] Old cache:', {
        isLiked: oldPin?.isLiked,
        likeCount: oldPin?.likeCount,
      });

      queryClient.setQueryData(queryKeys.pins.byId(pinId), updatedPin);
      
      // ✅ DEBUG: проверяем что стало в кэше после обновления
      const newPin = queryClient.getQueryData<PinResponse>(queryKeys.pins.byId(pinId));
      console.log('[useLikePin] New cache:', {
        isLiked: newPin?.isLiked,
        likeCount: newPin?.likeCount,
      });

      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.likes(pinId),
        refetchType: 'none',
      });
      
      onSuccess?.(updatedPin);
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

export default useLikePin;