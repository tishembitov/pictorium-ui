// src/modules/search/hooks/useSearchPins.ts

import { useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { searchApi } from '../api/searchApi';
import type { PinSearchParams, PinSearchResult } from '../types/search.types';

interface UseSearchPinsOptions extends Omit<PinSearchParams, 'page'> {
  enabled?: boolean;
  pageSize?: number;
}

export const useSearchPins = (options: UseSearchPinsOptions = {}) => {
  const { 
    enabled = true, 
    pageSize = 20,
    q,
    tags,
    authorId,
    createdFrom,
    createdTo,
    sortBy = 'RELEVANCE',
    sortOrder = 'DESC',
    fuzzy = true,
    highlight = true,
    personalized = true,
  } = options;

  const params = useMemo(() => ({
    q,
    tags,
    authorId,
    createdFrom,
    createdTo,
    sortBy,
    sortOrder,
    fuzzy,
    highlight,
    personalized,
  }), [q, tags, authorId, createdFrom, createdTo, sortBy, sortOrder, fuzzy, highlight, personalized]);

  const query = useInfiniteQuery({
    queryKey: queryKeys.search.pinsInfinite(params),
    queryFn: ({ pageParam = 0 }) =>
      searchApi.searchPins({ ...params, page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.currentPage + 1 : undefined,
    enabled: enabled && !!q,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const pins = useMemo<PinSearchResult[]>(
    () => query.data?.pages.flatMap((page) => page.results) ?? [],
    [query.data]
  );

  const aggregations = query.data?.pages[0]?.aggregations;
  const totalHits = query.data?.pages[0]?.totalHits ?? 0;
  const took = query.data?.pages[0]?.took ?? 0;

  const handleFetchNextPage = useCallback(() => {
    query.fetchNextPage();
  }, [query]);

  return {
    pins,
    totalHits,
    took,
    aggregations,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: handleFetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useSearchPins;