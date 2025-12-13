// src/modules/tag/hooks/useTags.ts

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { tagApi } from '../api/tagApi';
import type { Pageable, PageResponse } from '@/shared/types/pageable.types';
import type { TagResponse } from '../types/tag.types';

interface UseTagsOptions {
  pageable?: Pageable;
  enabled?: boolean;
}

/**
 * Hook to get paginated tags
 */
export const useTags = (options: UseTagsOptions = {}) => {
  const { pageable = { page: 0, size: 20 }, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.tags.list(pageable.page),
    queryFn: () => tagApi.getAll(pageable),
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes - tags don't change often
  });
};

/**
 * Hook for infinite scroll tags
 */
export const useInfiniteTags = (options: { size?: number; enabled?: boolean } = {}) => {
  const { size = 20, enabled = true } = options;

  return useInfiniteQuery({
    queryKey: [...queryKeys.tags.all, 'infinite'],
    queryFn: ({ pageParam = 0 }) => 
      tagApi.getAll({ page: pageParam, size }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: PageResponse<TagResponse>) => {
      if (lastPage.last) return undefined;
      return lastPage.number + 1;
    },
    enabled,
    staleTime: 1000 * 60 * 10,
  });
};

export default useTags;