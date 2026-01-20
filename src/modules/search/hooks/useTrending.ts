// src/modules/search/hooks/useTrending.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { searchApi } from '../api/searchApi';

interface UseTrendingOptions {
  limit?: number;
  enabled?: boolean;
}

export const useTrending = (options: UseTrendingOptions = {}) => {
  const { limit = 10, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.search.trending(limit),
    queryFn: () => searchApi.getTrending(limit),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export default useTrending;