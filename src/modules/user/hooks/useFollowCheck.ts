// src/modules/user/hooks/useFollowCheck.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { subscriptionApi } from '../api/subscriptionApi';
import { useAuth } from '@/modules/auth';

interface UseFollowCheckOptions {
  enabled?: boolean;
}

/**
 * Hook to check if current user follows a specific user
 */
export const useFollowCheck = (
  userId: string | null | undefined,
  options: UseFollowCheckOptions = {}
) => {
  const { enabled = true } = options;
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.subscriptions.check(userId || ''),
    queryFn: () => subscriptionApi.checkFollow(userId!),
    enabled: enabled && !!userId && isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    isFollowing: query.data?.isFollowing ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useFollowCheck;