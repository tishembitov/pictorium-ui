// src/modules/user/hooks/useUnfollow.ts

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { subscriptionApi } from '../api/subscriptionApi';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/modules/auth';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import type { FollowCheckResponse, PageUserResponse } from '../types/subscription.types';

interface UseUnfollowOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Removes user from following list pages
 */
const removeUserFromPages = (
  data: InfiniteData<PageUserResponse> | undefined,
  userId: string
): InfiniteData<PageUserResponse> | undefined => {
  if (!data?.pages) return data;

  let removedCount = 0;

  const newPages = data.pages.map((page) => {
    const originalLength = page.content.length;
    const filteredContent = page.content.filter((u) => u.id !== userId);
    removedCount += originalLength - filteredContent.length;

    return {
      ...page,
      content: filteredContent,
      numberOfElements: filteredContent.length,
      totalElements: Math.max(0, page.totalElements - removedCount),
    };
  });

  return {
    ...data,
    pages: newPages,
  };
};

/**
 * Hook to unfollow a user
 */
export const useUnfollow = (options: UseUnfollowOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const mutation = useMutation({
    mutationFn: (userId: string) => subscriptionApi.unfollow(userId),
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
        { isFollowing: false }
      );

      // Optimistic: remove from current user's following list
      if (currentUserId) {
        queryClient.setQueryData<InfiniteData<PageUserResponse>>(
          [...queryKeys.subscriptions.following(currentUserId), 'infinite'],
          (oldData) => removeUserFromPages(oldData, userId)
        );
      }

      // Optimistic: remove current user from target's followers list
      if (currentUserId) {
        queryClient.setQueryData<InfiniteData<PageUserResponse>>(
          [...queryKeys.subscriptions.followers(userId), 'infinite'],
          (oldData) => removeUserFromPages(oldData, currentUserId)
        );
      }

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
        toast.success(SUCCESS_MESSAGES.UNFOLLOWED);
      }

      onSuccess?.();
    },
    onError: (error: Error, userId, context) => {
      // Rollback check
      if (context?.previousCheck) {
        queryClient.setQueryData(
          queryKeys.subscriptions.check(userId),
          context.previousCheck
        );
      }

      // Rollback following list
      if (currentUserId && context?.previousFollowing) {
        queryClient.setQueryData(
          [...queryKeys.subscriptions.following(currentUserId), 'infinite'],
          context.previousFollowing
        );
      }

      // Rollback followers list
      if (context?.previousTargetFollowers) {
        queryClient.setQueryData(
          [...queryKeys.subscriptions.followers(userId), 'infinite'],
          context.previousTargetFollowers
        );
      }

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