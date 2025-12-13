// src/modules/tag/hooks/useSearchTags.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { tagApi } from '../api/tagApi';
import { useDebounce } from '@/shared/hooks/useDebounce';

interface UseSearchTagsOptions {
  limit?: number;
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Hook to search tags with debounce
 */
export const useSearchTags = (
  query: string,
  options: UseSearchTagsOptions = {}
) => {
  const { limit = 10, enabled = true, debounceMs = 300 } = options;
  
  const debouncedQuery = useDebounce(query, debounceMs);
  const trimmedQuery = debouncedQuery.trim();

  return useQuery({
    queryKey: queryKeys.tags.search(trimmedQuery),
    queryFn: () => tagApi.search({ q: trimmedQuery, limit }),
    enabled: enabled && trimmedQuery.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });
};

export default useSearchTags;