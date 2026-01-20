// src/modules/search/hooks/useSearchBoards.ts

import { useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { searchApi } from '../api/searchApi';
import type { BoardSearchParams, BoardSearchResult } from '../types/search.types';

interface UseSearchBoardsOptions extends Omit<BoardSearchParams, 'page'> {
  enabled?: boolean;
  pageSize?: number;
}

export const useSearchBoards = (options: UseSearchBoardsOptions) => {
  const { 
    enabled = true, 
    pageSize = 20,
    q,
    userId,
    sortBy = 'RELEVANCE',
    sortOrder = 'DESC',
    fuzzy = true,
    highlight = true,
  } = options;

  const params = useMemo(() => ({
    q,
    userId,
    sortBy,
    sortOrder,
    fuzzy,
    highlight,
  }), [q, userId, sortBy, sortOrder, fuzzy, highlight]);

  const query = useInfiniteQuery({
    queryKey: queryKeys.search.boardsInfinite(params),
    queryFn: ({ pageParam = 0 }) =>
      searchApi.searchBoards({ ...params, page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.currentPage + 1 : undefined,
    enabled: enabled && !!q,
    staleTime: 1000 * 60 * 2,
  });

  const boards = useMemo<BoardSearchResult[]>(
    () => query.data?.pages.flatMap((page) => page.results) ?? [],
    [query.data]
  );

  const totalHits = query.data?.pages[0]?.totalHits ?? 0;
  const took = query.data?.pages[0]?.took ?? 0;

  const handleFetchNextPage = useCallback(() => {
    query.fetchNextPage();
  }, [query]);

  return {
    boards,
    totalHits,
    took,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: handleFetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useSearchBoards;