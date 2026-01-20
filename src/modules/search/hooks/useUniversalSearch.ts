// src/modules/search/hooks/useUniversalSearch.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { searchApi } from '../api/searchApi';
import { useDebounce } from '@/shared/hooks/useDebounce';

interface UseUniversalSearchOptions {
  size?: number;
  fuzzy?: boolean;
  enabled?: boolean;
  debounceMs?: number;
}

export const useUniversalSearch = (
  query: string,
  options: UseUniversalSearchOptions = {}
) => {
  const { 
    size = 10, 
    fuzzy = true, 
    enabled = true,
    debounceMs = 300,
  } = options;

  const debouncedQuery = useDebounce(query, debounceMs);
  const trimmedQuery = debouncedQuery.trim();

  return useQuery({
    queryKey: queryKeys.search.universal(trimmedQuery),
    queryFn: () => searchApi.searchAll(trimmedQuery, { size, fuzzy }),
    enabled: enabled && trimmedQuery.length > 0,
    staleTime: 1000 * 60 * 2,
  });
};

export default useUniversalSearch;