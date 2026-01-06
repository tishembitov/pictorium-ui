// src/modules/user/hooks/useUnfollow.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { subscriptionApi } from '../api/subscriptionApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';

interface UseUnfollowOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Простая мутация для отписки.
 */
export const useUnfollow = (options: UseUnfollowOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: (userId: string) => subscriptionApi.unfollow(userId),
    
    onSuccess: (_, userId) => {
      // Фоновая инвалидация
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.check(userId),
        refetchType: 'none',
      });
      
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.followers(userId),
        refetchType: 'none',
      });
      
      if (currentUserId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.subscriptions.following(currentUserId),
          refetchType: 'none',
        });
      }

      if (showToast) {
        toast.follow.unfollowed();
      }

      onSuccess?.();
    },
    
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to unfollow user'); // Можно поменять на пресет, если потребуется
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