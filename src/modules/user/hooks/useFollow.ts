// src/modules/user/hooks/useFollow.ts

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { subscriptionApi } from '../api/subscriptionApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import type { FollowCheckResponse, PageUserResponse } from '../types/subscription.types';

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
  const currentUserId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: (userId: string) => subscriptionApi.follow(userId),
    onMutate: async (userId) => {
      // Cancel related queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.subscriptions.check(userId),
      });

      // Snapshot previous data
      const previousCheck = queryClient.getQueryData<FollowCheckResponse>(
        queryKeys.subscriptions.check(userId)
      );

      const previousFollowing = currentUserId
        ? queryClient.getQueryData<InfiniteData<PageUserResponse>>(
            [...queryKeys.subscriptions.following(currentUserId), 'infinite']
          )
        : undefined;

      const previousTargetFollowers = queryClient.getQueryData<InfiniteData<PageUserResponse>>(
        [...queryKeys.subscriptions.followers(userId), 'infinite']
      );

      // Optimistic update for follow check
      queryClient.setQueryData<FollowCheckResponse>(
        queryKeys.subscriptions.check(userId),
        { isFollowing: true }
      );

      return { previousCheck, previousFollowing, previousTargetFollowers, userId };
    },
    onSuccess: (_, userId) => {
      // Invalidate to get fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.check(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.followers(userId),
      });
      if (currentUserId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.subscriptions.following(currentUserId),
        });
      }

      if (showToast) {
        toast.success(SUCCESS_MESSAGES.FOLLOWED);
      }

      onSuccess?.();
    },
    onError: (error: Error, userId, context) => {
      // Rollback
      if (context?.previousCheck) {
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
    follow: mutation.mutate,
    followAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};

export default useFollow;