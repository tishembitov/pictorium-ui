// src/modules/search/hooks/usePersonalizedFeed.ts

import { useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { useAuth } from '@/modules/auth';
import { PinSearchResult, searchApi, SearchSortBy } from '@/modules/search';

export interface PersonalizedFeedOptions {
  /** Filter by tags/categories */
  tags?: string[];
  /** Sort order - defaults based on auth status */
  sortBy?: SearchSortBy;
  /** Filter pins from this date (for "Today" tab) */
  createdFrom?: string;
  /** Enable/disable query */
  enabled?: boolean;
  /** Page size */
  pageSize?: number;
}

/**
 * Hook for personalized feed on Explore page.
 * Uses search API with personalized=true for authenticated users.
 * Falls back to popular pins for anonymous users.
 */
export const usePersonalizedFeed = (options: PersonalizedFeedOptions = {}) => {
  const { isAuthenticated } = useAuth();
  
  const { 
    tags,
    sortBy,
    createdFrom,
    enabled = true, 
    pageSize = 25,
  } = options;

  // Determine effective sort - personalized relevance for auth users, popular for anon
  const effectiveSortBy = useMemo(() => {
    if (sortBy) return sortBy;
    return isAuthenticated ? 'RELEVANCE' : 'POPULAR';
  }, [sortBy, isAuthenticated]);

  // Build query params
  const params = useMemo(() => ({
    // No 'q' - we want recommendations, not search results
    tags,
    createdFrom,
    sortBy: effectiveSortBy,
    sortOrder: 'DESC' as const,
    fuzzy: false,
    highlight: false,
    // Key feature: personalization only for authenticated users
    personalized: isAuthenticated,
  }), [tags, createdFrom, effectiveSortBy, isAuthenticated]);

  // Create stable query key
  const queryKey = useMemo(() => 
    queryKeys.search.pinsInfinite({ 
      ...params, 
      _feed: 'personalized',
      _auth: isAuthenticated,
    }),
    [params, isAuthenticated]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      return searchApi.searchPins({ 
        ...params, 
        page: pageParam, 
        size: pageSize,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.currentPage + 1 : undefined,
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Flatten pages into single array
  const pins = useMemo<PinSearchResult[]>(
    () => query.data?.pages.flatMap((page) => page.results) ?? [],
    [query.data]
  );

  // Get metadata from first page
  const totalHits = query.data?.pages[0]?.totalHits ?? 0;
  const aggregations = query.data?.pages[0]?.aggregations;

  const handleFetchNextPage = useCallback(() => {
    if (!query.isFetchingNextPage && query.hasNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  return {
    pins,
    totalHits,
    aggregations,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: handleFetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isPersonalized: isAuthenticated,
  };
};

export default usePersonalizedFeed;