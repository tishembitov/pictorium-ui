// src/modules/pin/hooks/usePins.ts

import { useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import type { PinFilter, PinScope, PinSort, PinResponse } from '../types/pin.types';
import { PAGINATION } from '@/shared/utils/constants';

// ==================== Types ====================

interface UsePinsOptions {
  enabled?: boolean;
  pageSize?: number;
  sort?: PinSort;
}

interface UsePinsResult {
  pins: PinResponse[];
  totalElements: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

// ==================== Query Key Builder ====================

/**
 * Строит query key на основе фильтра.
 * Использует унифицированные ключи для предсказуемой инвалидации.
 */
const buildQueryKey = (filter: PinFilter, sort?: PinSort) => {
  // Базовый ключ для списков
  return [...queryKeys.pins.lists(), { ...filter, sort }] as const;
};

// ==================== Filter Builder ====================

const buildUserFilter = (userId: string, scope: PinScope): PinFilter => {
  const base = { scope };
  
  switch (scope) {
    case 'CREATED':
      return { ...base, authorId: userId };
    case 'SAVED':
      return { ...base, savedBy: userId };
    case 'LIKED':
      return { ...base, likedBy: userId };
    default:
      return base;
  }
};

// ==================== Main Hook ====================

export const usePins = (
  filter: PinFilter = {},
  options: UsePinsOptions = {}
): UsePinsResult => {
  const { 
    enabled = true, 
    pageSize = PAGINATION.PIN_GRID_SIZE,
    sort,
  } = options;

  // ✅ Используем унифицированный query key
  const queryKey = useMemo(() => buildQueryKey(filter, sort), [filter, sort]);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) =>
      pinApi.getAll(filter, { page: pageParam, size: pageSize }, sort),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const pins = useMemo(
    () => query.data?.pages.flatMap((page) => page.content) ?? [],
    [query.data]
  );

  const totalElements = query.data?.pages[0]?.totalElements ?? 0;

  const handleFetchNextPage = useCallback(() => {
    query.fetchNextPage();
  }, [query]);

  const handleRefetch = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    pins,
    totalElements,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: handleFetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: handleRefetch,
  };
};

// ==================== User Pins Hook ====================

export const useUserPins = (
  userId: string | undefined,
  scope: PinScope = 'CREATED',
  options: UsePinsOptions = {}
): UsePinsResult => {
  const filter = useMemo(() => {
    if (!userId) return {};
    return buildUserFilter(userId, scope);
  }, [userId, scope]);

  return usePins(filter, {
    ...options,
    enabled: !!userId && options.enabled !== false,
  });
};

// ==================== Related Pins Hook ====================

export const useRelatedPins = (
  pinId: string | undefined,
  options: Omit<UsePinsOptions, 'sort'> = {}
): UsePinsResult => {
  const filter = useMemo((): PinFilter => {
    if (!pinId) return {};
    return { relatedTo: pinId, scope: 'RELATED' };
  }, [pinId]);

  return usePins(filter, {
    ...options,
    enabled: !!pinId && options.enabled !== false,
  });
};

export default usePins;