// src/modules/search/hooks/useSimilarPins.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { searchApi } from '../api/searchApi';

interface UseSimilarPinsOptions {
  limit?: number;
  enabled?: boolean;
}

export const useSimilarPins = (
  pinId: string | null | undefined,
  options: UseSimilarPinsOptions = {}
) => {
  const { limit = 20, enabled = true } = options;

  const query = useQuery({
    queryKey: queryKeys.search.similar(pinId || ''),
    queryFn: () => searchApi.findSimilarPins(pinId!, limit),
    enabled: enabled && !!pinId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    pins: query.data?.results ?? [],
    totalHits: query.data?.totalHits ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useSimilarPins;