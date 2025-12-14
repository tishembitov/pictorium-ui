// src/modules/pin/hooks/usePinComments.ts

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { pinCommentApi } from '../api/pinCommentApi';
import type { Pageable } from '@/shared/types/pageable.types';
import { PAGINATION } from '@/shared/utils/constants';

interface UsePinCommentsOptions {
  enabled?: boolean;
  pageable?: Pageable;
}

/**
 * Hook to get comments for a pin
 */
export const usePinComments = (
  pinId: string | null | undefined,
  options: UsePinCommentsOptions = {}
) => {
  const { enabled = true, pageable = {} } = options;

  const query = useQuery({
    queryKey: [...queryKeys.pins.comments(pinId || ''), pageable],
    queryFn: () => pinCommentApi.getComments(pinId!, pageable),
    enabled: enabled && !!pinId,
    staleTime: 1000 * 60 * 2,
  });

  return {
    data: query.data,
    comments: query.data?.content ?? [],
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for infinite scroll comments
 */
export const useInfinitePinComments = (
  pinId: string | null | undefined,
  options: { enabled?: boolean; pageSize?: number } = {}
) => {
  const { enabled = true, pageSize = PAGINATION.COMMENTS_SIZE } = options;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.pins.comments(pinId || ''), 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      pinCommentApi.getComments(pinId!, { page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: enabled && !!pinId,
    staleTime: 1000 * 60 * 2,
  });

  const comments = query.data?.pages.flatMap((page) => page.content) ?? [];
  const totalElements = query.data?.pages[0]?.totalElements ?? 0;

  return {
    comments,
    totalElements,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default usePinComments;