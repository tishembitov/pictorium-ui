// src/modules/tag/hooks/useTag.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { tagApi } from '../api/tagApi';

interface UseTagOptions {
  enabled?: boolean;
}

/**
 * Hook to get a single tag by ID
 */
export const useTag = (tagId: string | null | undefined, options: UseTagOptions = {}) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.tags.byId(tagId || ''),
    queryFn: () => tagApi.getById(tagId!),
    enabled: enabled && !!tagId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export default useTag;