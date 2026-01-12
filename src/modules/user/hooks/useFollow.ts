// src/modules/user/hooks/useFollow.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { subscriptionApi } from '../api/subscriptionApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import type { FollowCheckResponse } from '../types/subscription.types';

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
    
    // ✅ Optimistic update
    onMutate: async ({ userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.subscriptions.check(userId),
      });

      // Snapshot previous value
      const previousCheck = queryClient.getQueryData<FollowCheckResponse>(
        queryKeys.subscriptions.check(userId)
      );

      // Optimistically update
      queryClient.setQueryData<FollowCheckResponse>(
        queryKeys.subscriptions.check(userId),
        { isFollowing: true }
      );

      return { previousCheck, userId };
    },
    
    onSuccess: (_, { userId, username }) => {
      // Invalidate related queries (will refetch in background)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.followers(userId),
      });
      
      if (currentUserId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.subscriptions.following(currentUserId),
        });
      }

      if (showToast) {
        toast.follow.followed(username);
      }

      onSuccess?.(userId, username);
    },
    
    onError: (error: Error, { userId }, context) => {
      // Rollback on error
      if (context?.previousCheck !== undefined) {
        queryClient.setQueryData(
          queryKeys.subscriptions.check(userId),
          context.previousCheck
        );
      }

      if (showToast) {
        toast.error(error.message || 'Failed to follow user');
      }
      onError?.(error);
    },
  });

  return {
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