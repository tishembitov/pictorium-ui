// src/modules/user/hooks/useUnfollow.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { subscriptionApi } from '../api/subscriptionApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';

interface UseUnfollowOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Hook to unfollow a user
 */
export const useUnfollow = (options: UseUnfollowOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (userId: string) => subscriptionApi.unfollow(userId),
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
        toast.success(SUCCESS_MESSAGES.UNFOLLOWED);
      }
      
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to unfollow user');
      }
      
      onError?.(error);
    },
  });

  return {
    unfollow: mutation.mutate,
    unfollowAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};

export default useUnfollow;