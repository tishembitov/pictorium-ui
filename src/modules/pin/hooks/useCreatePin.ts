// src/modules/pin/hooks/useCreatePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import { buildPath } from '@/app/router/routeConfig';
import type { PinCreateRequest, PinResponse } from '../types/pin.types';

interface UseCreatePinOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  navigateToPin?: boolean;
}

/**
 * Мутация для создания пина.
 * ✅ Кладёт созданный пин в кэш для мгновенного отображения на PinDetail.
 */
export const useCreatePin = (options: UseCreatePinOptions = {}) => {
  const {
    onSuccess,
    onError,
    showToast = true,
    navigateToPin = true,
  } = options;
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: PinCreateRequest) => pinApi.create(data),
    
    onSuccess: (data) => {
      // ✅ КЛЮЧЕВОЕ: Кладём созданный пин в кэш
      // При переходе на PinDetail данные уже будут в кэше
      queryClient.setQueryData(queryKeys.pins.byId(data.id), data);

      // Инвалидируем списки пинов (новый пин должен появиться)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });

      // Инвалидируем boards.my() для обновления pinCount досок
      void queryClient.invalidateQueries({
        queryKey: queryKeys.boards.my(),
        refetchType: 'none',
      });

      if (showToast) {
        toast.pin.created();
      }

      if (navigateToPin) {
        navigate(buildPath.pin(data.id));
      }

      onSuccess?.(data);
    },
    
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to create pin');
      }
      onError?.(error);
    },
  });

  return {
    createPin: mutation.mutate,
    createPinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export default useCreatePin;