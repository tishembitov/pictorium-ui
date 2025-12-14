// src/modules/pin/hooks/useSavePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { savedPinApi } from '../api/savedPinApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import { useAuthStore } from '@/modules/auth';
import type { PinResponse } from '../types/pin.types';

interface UseSavePinOptions {
  onSuccess?: (data: PinResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Hook to save a pin with optimistic update
 */
export const useSavePin = (options: UseSavePinOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: (pinId: string) => savedPinApi.save(pinId),
    onMutate: async (pinId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });

      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      if (previousPin) {
        queryClient.setQueryData<PinResponse>(queryKeys.pins.byId(pinId), {
          ...previousPin,
          isSaved: true,
          saveCount: previousPin.saveCount + 1,
        });
      }

      return { previousPin };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.pins.byId(data.id), data);
      // Invalidate saved pins list for current user
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.pins.saved(userId) });
      }
      // Also invalidate all pins lists that might contain this pin
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });
      
      if (showToast) {
        toast.success(SUCCESS_MESSAGES.PIN_SAVED);
      }
      
      onSuccess?.(data);
    },
    onError: (error: Error, pinId, context) => {
      if (context?.previousPin) {
        queryClient.setQueryData(queryKeys.pins.byId(pinId), context.previousPin);
      }
      
      if (showToast) {
        toast.error(error.message || 'Failed to save pin');
      }
      
      onError?.(error);
    },
  });

  return {
    savePin: mutation.mutate,
    savePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useSavePin;