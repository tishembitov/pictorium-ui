// src/modules/search/hooks/useSuggestions.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { searchApi } from '../api/searchApi';
import { useDebounce } from '@/shared/hooks/useDebounce';

interface UseSuggestionsOptions {
  limit?: number;
  enabled?: boolean;
  debounceMs?: number;
}

export const useSuggestions = (
  query: string,
  options: UseSuggestionsOptions = {}
) => {
  const { limit = 10, enabled = true, debounceMs = 200 } = options;

  const debouncedQuery = useDebounce(query, debounceMs);
  const trimmedQuery = debouncedQuery.trim();

  return useQuery({
    queryKey: queryKeys.search.suggest(trimmedQuery),
    queryFn: () => searchApi.suggest(trimmedQuery, limit),
    enabled: enabled && trimmedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export default useSuggestions;