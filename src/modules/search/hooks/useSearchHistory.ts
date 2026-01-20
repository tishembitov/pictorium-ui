// src/modules/search/hooks/useSearchHistory.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { searchApi } from '../api/searchApi';
import { useAuth } from '@/modules/auth';

interface UseSearchHistoryOptions {
  limit?: number;
  enabled?: boolean;
}

export const useSearchHistory = (options: UseSearchHistoryOptions = {}) => {
  const { limit = 20, enabled = true } = options;
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.search.history(),
    queryFn: () => searchApi.getHistory(limit),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });
};

export default useSearchHistory;