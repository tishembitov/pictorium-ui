// src/modules/pin/hooks/useDeletePin.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useToast } from '@/shared/hooks/useToast';
import { ROUTES } from '@/app/router/routeConfig';

interface UseDeletePinOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  navigateOnSuccess?: boolean;
}

/**
 * Простая мутация для удаления пина.
 * После успеха - редирект и инвалидация.
 */
export const useDeletePin = (options: UseDeletePinOptions = {}) => {
  const { 
    onSuccess, 
    onError, 
    navigateOnSuccess = true,
  } = options;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (pinId: string) => pinApi.delete(pinId),

    onSuccess: (_, pinId) => {
      // Удаляем из кэша
      queryClient.removeQueries({ queryKey: queryKeys.pins.byId(pinId) });
      
      // Инвалидируем списки - обновятся при следующем просмотре
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.pins.all,
        refetchType: 'none',
      });
      
      toast.success('Pin deleted');
      
      if (navigateOnSuccess) {
        navigate(ROUTES.HOME);
      }
      
      onSuccess?.();
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete pin');
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