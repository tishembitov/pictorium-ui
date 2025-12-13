// src/modules/user/hooks/useFollow.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { subscriptionApi } from '../api/subscriptionApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';

interface UseFollowOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Hook to follow a user
 */
export const useFollow = (options: UseFollowOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (userId: string) => subscriptionApi.follow(userId),
    onSuccess: (_, userId) => {
      // Invalidate follow check
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.subscriptions.check(userId) 
      });
      // Invalidate followers/following lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.subscriptions.all 
      });
      
      if (showToast) {
        toast.success(SUCCESS_MESSAGES.FOLLOWED);
      }
      
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to follow user');
      }
      
      onError?.(error);
    },
  });

  return {
    follow: mutation.mutate,
    followAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};

export default useFollow;