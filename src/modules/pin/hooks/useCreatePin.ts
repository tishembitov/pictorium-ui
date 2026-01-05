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
      // ✅ Инвалидируем только списки пинов (не детали)
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });
      
      if (showToast) {
        toast.success('Pin created!');
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