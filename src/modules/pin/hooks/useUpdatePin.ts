// src/modules/pin/hooks/useUpdatePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import type { PinUpdateRequest, PinResponse } from '../types/pin.types';

interface UseUpdatePinOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Hook to update a pin
 */
export const useUpdatePin = (options: UseUpdatePinOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: ({ pinId, data }: { pinId: string; data: PinUpdateRequest }) =>
      pinApi.update(pinId, data),
    onSuccess: (data, variables) => {
      // Update pin in cache
      queryClient.setQueryData(queryKeys.pins.byId(variables.pinId), data);
      // Invalidate pins list
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });
      
      if (showToast) {
        toast.success(SUCCESS_MESSAGES.PIN_UPDATED);
      }
      
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to update pin');
      }
      
      onError?.(error);
    },
  });

  return {
    updatePin: mutation.mutate,
    updatePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
};

export default useUpdatePin;