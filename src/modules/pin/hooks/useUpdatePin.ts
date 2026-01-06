// src/modules/pin/hooks/useUpdatePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import type { PinUpdateRequest, PinResponse } from '../types/pin.types';

interface UseUpdatePinOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
}

export const useUpdatePin = (options: UseUpdatePinOptions = {}) => {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: ({ pinId, data }: { pinId: string; data: PinUpdateRequest }) =>
      pinApi.update(pinId, data),
      
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.pins.byId(variables.pinId), data);
      
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.lists(),
        refetchType: 'none',
      });
      
      // ✅ Исправлено: используем pin.updated вместо pin.saved
      toast.pin.updated();
      onSuccess?.(data);
    },
    
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update pin');
      onError?.(error);
    },
  });

  return {
    updatePin: mutation.mutate,
    updatePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
};

export default useUpdatePin;