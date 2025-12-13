// src/modules/user/hooks/useFollowers.ts

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { subscriptionApi } from '../api/subscriptionApi';
import type { Pageable } from '@/shared/types/pageable.types';
import { PAGINATION } from '@/shared/utils/constants';

interface UseFollowersOptions {
  enabled?: boolean;
  pageable?: Pageable;
}

/**
 * Hook to get user's followers (paginated)
 */
export const useFollowers = (
  userId: string | null | undefined,
  options: UseFollowersOptions = {}
) => {
  const { enabled = true, pageable = {} } = options;

  const query = useQuery({
    queryKey: [...queryKeys.subscriptions.followers(userId || ''), pageable],
    queryFn: () => subscriptionApi.getFollowers(userId!, pageable),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    data: query.data,
    followers: query.data?.content ?? [],
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get user's followers with infinite scroll
 */
export const useInfiniteFollowers = (
  userId: string | null | undefined,
  options: { enabled?: boolean; pageSize?: number } = {}
) => {
  const { enabled = true, pageSize = PAGINATION.USERS_SIZE } = options;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.subscriptions.followers(userId || ''), 'infinite'],
    queryFn: ({ pageParam = 0 }) => 
      subscriptionApi.getFollowers(userId!, { page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => 
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const followers = query.data?.pages.flatMap((page) => page.content) ?? [];
  const totalElements = query.data?.pages[0]?.totalElements ?? 0;

  return {
    followers,
    totalElements,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useFollowers;