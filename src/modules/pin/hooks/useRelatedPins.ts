// src/modules/pin/hooks/useRelatedPins.ts

import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinApi } from '../api/pinApi';
import { PAGINATION } from '@/shared/utils/constants';

interface UseRelatedPinsOptions {
  enabled?: boolean;
  pageSize?: number;
}

/**
 * Hook to get related pins
 */
export const useRelatedPins = (
  pinId: string | null | undefined,
  options: UseRelatedPinsOptions = {}
) => {
  const { enabled = true, pageSize = PAGINATION.PIN_GRID_SIZE } = options;

  const query = useInfiniteQuery({
    queryKey: queryKeys.pins.related(pinId || ''),
    queryFn: ({ pageParam = 0 }) =>
      pinApi.getAll(
        { relatedTo: pinId!, scope: 'RELATED' },
        { page: pageParam, size: pageSize }
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: enabled && !!pinId,
    staleTime: 1000 * 60 * 5,
  });

  const pins = query.data?.pages.flatMap((page) => page.content) ?? [];
  const totalElements = query.data?.pages[0]?.totalElements ?? 0;

  return {
    pins,
    totalElements,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
  };
};

export default useRelatedPins;