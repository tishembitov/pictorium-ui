// src/modules/pin/hooks/usePins.ts

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import type { Pageable } from '@/shared/types/pageable.types';
import type { PinFilter } from '../types/pinFilter.types';
import { PAGINATION } from '@/shared/utils/constants';

interface UsePinsOptions {
  filter?: PinFilter;
  pageable?: Pageable;
  enabled?: boolean;
}

/**
 * Hook to get pins with filter and pagination
 */
export const usePins = (options: UsePinsOptions = {}) => {
  const { 
    filter = {}, 
    pageable = { page: 0, size: PAGINATION.PIN_GRID_SIZE }, 
    enabled = true 
  } = options;

  const query = useQuery({
    queryKey: queryKeys.pins.list({ ...filter, ...pageable } as Record<string, unknown>),
    queryFn: () => pinApi.getAll(filter, pageable),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
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
 * Hook for infinite scroll pins
 */
export const useInfinitePins = (
  filter: PinFilter = {},
  options: { enabled?: boolean; pageSize?: number } = {}
) => {
  const { enabled = true, pageSize = PAGINATION.PIN_GRID_SIZE } = options;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.pins.list(filter as Record<string, unknown>), 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      pinApi.getAll(filter, { page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const pins = query.data?.pages.flatMap((page) => page.content) ?? [];
  const totalElements = query.data?.pages[0]?.totalElements ?? 0;

  return {
    pins,
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

export default usePins;