// src/modules/pin/hooks/useSavedToProfilePins.ts

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { useAuth } from '@/modules/auth';
import type { Pageable } from '@/shared/types/pageable.types';
import { PAGINATION } from '@/shared/utils/constants';

interface UseSavedToProfilePinsOptions {
  enabled?: boolean;
  pageable?: Pageable;
}

/**
 * Hook to get pins saved to profile by user ID
 */
export const useSavedToProfilePins = (
  userId: string | null | undefined,
  options: UseSavedToProfilePinsOptions = {}
) => {
  const { enabled = true, pageable = {} } = options;

  const query = useQuery({
    queryKey: [...queryKeys.pins.savedToProfile(userId || ''), pageable],
    queryFn: () => pinApi.getSavedToProfilePins(userId!, pageable),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 2,
  });

  return {
    data: query.data,
    pins: query.data?.content ?? [],
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to get my pins saved to profile
 */
export const useMySavedToProfilePins = (
  options: { enabled?: boolean; pageSize?: number } = {}
) => {
  const { enabled = true, pageSize = PAGINATION.PIN_GRID_SIZE } = options;
  const { isAuthenticated } = useAuth();

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.pins.mySavedToProfile(), 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      pinApi.getMySavedToProfilePins({ page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: enabled && isAuthenticated,
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
 * Hook for infinite scroll saved to profile pins by user
 */
export const useInfiniteSavedToProfilePins = (
  userId: string | null | undefined,
  options: { enabled?: boolean; pageSize?: number } = {}
) => {
  const { enabled = true, pageSize = PAGINATION.PIN_GRID_SIZE } = options;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.pins.savedToProfile(userId || ''), 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      pinApi.getSavedToProfilePins(userId!, { page: pageParam, size: pageSize }),
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

export default useSavedToProfilePins;