// src/modules/pin/hooks/useUnlikePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinLikeApi } from '../api/pinLikeApi';
import type { PinResponse } from '../types/pin.types';

interface UseUnlikePinOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Мутация для анлайка пина.
 * - Локальный state обновляется мгновенно в компоненте через onToggle
 * - Кэш обновляется после успешного ответа сервера
 */
export const useUnlikePin = (options: UseUnlikePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinLikeApi.unlike(pinId),

    onSuccess: (updatedPin, pinId) => {
      // ✅ Обновляем кэш конкретного пина данными от сервера
      queryClient.setQueryData(
        queryKeys.pins.byId(pinId), 
        updatedPin
      );
      
      // Фоновая инвалидация связанных данных
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
    unlikePin: mutation.mutate,
    unlikePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export default useUnlikePin;