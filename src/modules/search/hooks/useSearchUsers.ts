// src/modules/search/hooks/useSearchUsers.ts

import { useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { searchApi } from '../api/searchApi';
import type { UserSearchParams, UserSearchResult } from '../types/search.types';

interface UseSearchUsersOptions extends Omit<UserSearchParams, 'page'> {
  enabled?: boolean;
  pageSize?: number;
}

export const useSearchUsers = (options: UseSearchUsersOptions) => {
  const { 
    enabled = true, 
    pageSize = 20,
    q,
    sortBy = 'RELEVANCE',
    sortOrder = 'DESC',
    fuzzy = true,
    highlight = true,
  } = options;

  const params = useMemo(() => ({
    q,
    sortBy,
    sortOrder,
    fuzzy,
    highlight,
  }), [q, sortBy, sortOrder, fuzzy, highlight]);

  const query = useInfiniteQuery({
    queryKey: queryKeys.search.usersInfinite(params),
    queryFn: ({ pageParam = 0 }) =>
      searchApi.searchUsers({ ...params, page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.currentPage + 1 : undefined,
    enabled: enabled && !!q,
    staleTime: 1000 * 60 * 2,
  });

  const users = useMemo<UserSearchResult[]>(
    () => query.data?.pages.flatMap((page) => page.results) ?? [],
    [query.data]
  );

  const totalHits = query.data?.pages[0]?.totalHits ?? 0;
  const took = query.data?.pages[0]?.took ?? 0;

  const handleFetchNextPage = useCallback(() => {
    query.fetchNextPage();
  }, [query]);

  return {
    users,
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

export default useSearchUsers;