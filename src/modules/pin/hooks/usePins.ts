// src/modules/pin/hooks/usePins.ts

import { useMemo } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { usePinFiltersStore, selectFilter, selectSortField, selectSortDirection } from '../stores/pinFiltersStore';
import { cleanFilterForApi, buildSortForApi, createFilterKey } from '../utils/pinFilterUtils';
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
 * Uses external filter only (not reactive to store)
 */
export const usePins = (options: UsePinsOptions = {}) => {
  const { 
    filter = {}, 
    pageable = { page: 0, size: PAGINATION.PIN_GRID_SIZE }, 
    enabled = true 
  } = options;

  // Memoize filter key to prevent unnecessary re-fetches
  const filterKey = useMemo(() => createFilterKey(filter), [filter]);

  const query = useQuery({
    queryKey: [...queryKeys.pins.all, 'list', filterKey, pageable.page, pageable.size],
    queryFn: () => pinApi.getAll(cleanFilterForApi(filter), pageable),
    enabled,
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
 * Hook for infinite scroll pins with external filter
 */
export const useInfinitePins = (
  filter: PinFilter = {},
  options: { enabled?: boolean; pageSize?: number; sort?: string[] } = {}
) => {
  const { enabled = true, pageSize = PAGINATION.PIN_GRID_SIZE, sort } = options;

  // Memoize filter key
  const filterKey = useMemo(() => createFilterKey(filter), [filter]);
  const sortKey = sort?.join(',') || 'createdAt,desc';

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.pins.all, 'infinite', filterKey, sortKey],
    queryFn: ({ pageParam = 0 }) =>
      pinApi.getAll(cleanFilterForApi(filter), { page: pageParam, size: pageSize, sort }),
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
 * Hook to use pins with store filters (reactive to store changes)
 * Uses individual selectors to minimize re-renders
 */
export const useStorePins = (options: { enabled?: boolean; pageSize?: number } = {}) => {
  const { enabled = true, pageSize = PAGINATION.PIN_GRID_SIZE } = options;
  
  // Use individual selectors - more stable than object selector
  const filter = usePinFiltersStore(selectFilter);
  const sortField = usePinFiltersStore(selectSortField);
  const sortDirection = usePinFiltersStore(selectSortDirection);

  // Memoize derived values
  const filterKey = useMemo(() => createFilterKey(filter), [filter]);
  const sort = useMemo(() => buildSortForApi(sortField, sortDirection), [sortField, sortDirection]);
  const sortKey = `${sortField},${sortDirection}`;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.pins.all, 'store', filterKey, sortKey],
    queryFn: ({ pageParam = 0 }) =>
      pinApi.getAll(cleanFilterForApi(filter), { page: pageParam, size: pageSize, sort }),
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

export default usePins;