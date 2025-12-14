// src/modules/pin/hooks/useUnsavePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { savedPinApi } from '../api/savedPinApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import { useAuthStore } from '@/modules/auth';
import type { PinResponse } from '../types/pin.types';

interface UseUnsavePinOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Hook to unsave a pin with optimistic update
 */
export const useUnsavePin = (options: UseUnsavePinOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: (pinId: string) => savedPinApi.unsave(pinId),
    onMutate: async (pinId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pins.byId(pinId) });

      const previousPin = queryClient.getQueryData<PinResponse>(
        queryKeys.pins.byId(pinId)
      );

      if (previousPin) {
        queryClient.setQueryData<PinResponse>(queryKeys.pins.byId(pinId), {
          ...previousPin,
          isSaved: false,
          saveCount: Math.max(0, previousPin.saveCount - 1),
        });
      }

      return { previousPin };
    },
    onSuccess: (_data, pinId) => {
      // Invalidate saved pins list for current user
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.pins.saved(userId) });
      }
      // Also invalidate the specific pin to refresh its state
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.byId(pinId) });
      
      if (showToast) {
        toast.success(SUCCESS_MESSAGES.PIN_UNSAVED);
      }
      
      onSuccess?.();
    },
    onError: (error: Error, pinId, context) => {
      if (context?.previousPin) {
        queryClient.setQueryData(queryKeys.pins.byId(pinId), context.previousPin);
      }
      
      if (showToast) {
        toast.error(error.message || 'Failed to unsave pin');
      }
      
      onError?.(error);
    },
  });

  return {
    unsavePin: mutation.mutate,
    unsavePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useUnsavePin;