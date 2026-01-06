// src/modules/user/hooks/useFollow.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { subscriptionApi } from '../api/subscriptionApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';

interface UseFollowOptions {
  onSuccess?: (userId: string, username?: string) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

interface FollowParams {
  userId: string;
  username?: string;
}

export const useFollow = (options: UseFollowOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: ({ userId }: FollowParams) => subscriptionApi.follow(userId),
    
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
        toast.follow.followed(username);
      }

      onSuccess?.(userId, username);
    },
    
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to follow user');
      }
      onError?.(error);
    },
  });

  return {
    // ✅ Удобная обёртка для вызова с двумя параметрами
    follow: (userId: string, username?: string) => 
      mutation.mutate({ userId, username }),
    followAsync: (userId: string, username?: string) => 
      mutation.mutateAsync({ userId, username }),
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};

export default useFollow;