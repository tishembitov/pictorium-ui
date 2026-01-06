// src/modules/user/hooks/useUnfollow.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { subscriptionApi } from '../api/subscriptionApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';

interface UseUnfollowOptions {
  onSuccess?: (userId: string, username?: string) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

interface UnfollowParams {
  userId: string;
  username?: string;
}

export const useUnfollow = (options: UseUnfollowOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: ({ userId }: UnfollowParams) => subscriptionApi.unfollow(userId),
    
    onSuccess: (_, { userId, username }) => {
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
        toast.follow.unfollowed(username);
      }

      onSuccess?.(userId, username);
    },
    
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to unfollow user');
      }
      onError?.(error);
    },
  });

  return {
    // ✅ Удобная обёртка для вызова с двумя параметрами
    unfollow: (userId: string, username?: string) => 
      mutation.mutate({ userId, username }),
    unfollowAsync: (userId: string, username?: string) => 
      mutation.mutateAsync({ userId, username }),
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};

export default useUnfollow;