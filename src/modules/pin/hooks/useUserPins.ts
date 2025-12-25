// src/modules/pin/hooks/useUserPins.ts

import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { buildUserPinFilter, type PinScope } from '../types/pinFilter.types';
import { cleanFilterForApi } from '../utils/pinFilterUtils';
import { PAGINATION } from '@/shared/utils/constants';

interface UseUserPinsOptions {
  enabled?: boolean;
  pageSize?: number;
}

/**
 * Hook to get pins for a specific user with scope
 */
export const useUserPins = (
  userId: string | null | undefined,
  scope: PinScope = 'CREATED',
  options: UseUserPinsOptions = {}
) => {
  const { enabled = true, pageSize = PAGINATION.PIN_GRID_SIZE } = options;

  // Memoize filter to prevent recreating on each render
  const filter = useMemo(() => {
    if (!userId) return {};
    return buildUserPinFilter(userId, scope);
  }, [userId, scope]);

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.pins.all, 'user', userId, scope],
    queryFn: ({ pageParam = 0 }) =>
      pinApi.getAll(cleanFilterForApi(filter), { page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const pins = query.data?.pages.flatMap((page) => page.content) ?? [];
  const totalElements = query.data?.pages[0]?.totalElements ?? 0;

  return {
    pins,
    totalElements,
    data: query.data,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get created pins by user
 */
export const useUserCreatedPins = (
  userId: string | null | undefined,
  options: UseUserPinsOptions = {}
) => {
  return useUserPins(userId, 'CREATED', options);
};

/**
 * Hook to get pins saved to boards by user
 */
export const useUserSavedPins = (
  userId: string | null | undefined,
  options: UseUserPinsOptions = {}
) => {
  return useUserPins(userId, 'SAVED', options);
};

/**
 * Hook to get pins saved to profile by user
 */
export const useUserSavedToProfilePins = (
  userId: string | null | undefined,
  options: UseUserPinsOptions = {}
) => {
  return useUserPins(userId, 'SAVED_TO_PROFILE', options);
};

/**
 * Hook to get all saved pins by user (boards + profile)
 */
export const useUserAllSavedPins = (
  userId: string | null | undefined,
  options: UseUserPinsOptions = {}
) => {
  return useUserPins(userId, 'SAVED_ALL', options);
};

/**
 * Hook to get liked pins by user
 */
export const useUserLikedPins = (
  userId: string | null | undefined,
  options: UseUserPinsOptions = {}
) => {
  return useUserPins(userId, 'LIKED', options);
};

export default useUserPins;