// src/modules/tag/hooks/useCategories.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { tagApi } from '../api/tagApi';

interface UseCategoriesOptions {
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to get categories (tags with representative pins)
 */
export const useCategories = (options: UseCategoriesOptions = {}) => {
  const { limit = 8, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.tags.categories(limit),
    queryFn: () => tagApi.getCategories(limit),
    enabled,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

export default useCategories;