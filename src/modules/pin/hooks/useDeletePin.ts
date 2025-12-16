// src/modules/pin/hooks/useDeletePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import { ROUTES } from '@/app/router/routeConfig';

interface UseDeletePinOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  navigateOnSuccess?: boolean;
}

/**
 * Hook to delete a pin
 */
export const useDeletePin = (options: UseDeletePinOptions = {}) => {
  const { 
    onSuccess, 
    onError, 
    showToast = true,
    navigateOnSuccess = true,
  } = options;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinApi.delete(pinId),
    onSuccess: (_, pinId) => {
      // Remove pin from cache
      queryClient.removeQueries({ queryKey: queryKeys.pins.byId(pinId) });
      // Invalidate pins list
      queryClient.invalidateQueries({ queryKey: queryKeys.pins.all });
      
      if (showToast) {
        toast.success(SUCCESS_MESSAGES.PIN_DELETED);
      }
      
      if (navigateOnSuccess) {
        navigate(ROUTES.HOME);
      }
      
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to delete pin');
      }
      
      onError?.(error);
    },
  });

  return {
    deletePin: mutation.mutate,
    deletePinAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useDeletePin;