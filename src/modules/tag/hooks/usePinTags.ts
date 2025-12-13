// src/modules/tag/hooks/usePinTags.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { tagApi } from '../api/tagApi';

interface UsePinTagsOptions {
  enabled?: boolean;
}

/**
 * Hook to get tags for a specific pin
 */
export const usePinTags = (
  pinId: string | null | undefined,
  options: UsePinTagsOptions = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.tags.byPin(pinId || ''),
    queryFn: () => tagApi.getByPin(pinId!),
    enabled: enabled && !!pinId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export default usePinTags;