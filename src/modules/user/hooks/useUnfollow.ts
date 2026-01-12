// src/modules/user/hooks/useUnfollow.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { subscriptionApi } from '../api/subscriptionApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import type { FollowCheckResponse } from '../types/subscription.types';

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
        { isFollowing: false }
      );

      return { previousCheck, userId };
    },
    
    onSuccess: (_, { userId, username }) => {
      // Invalidate related queries
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.followers(userId),
      });
      
      if (currentUserId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.subscriptions.following(currentUserId),
        });
      }

      if (showToast) {
        toast.follow.unfollowed(username);
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
        toast.error(error.message || 'Failed to unfollow user');
      }
      onError?.(error);
    },
  });

  return {
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