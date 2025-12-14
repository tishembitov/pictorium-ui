// src/modules/comment/hooks/useCommentLikes.ts

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentLikeApi } from '../api/commentLikeApi';
import type { Pageable } from '@/shared/types/pageable.types';
import { PAGINATION } from '@/shared/utils/constants';

interface UseCommentLikesOptions {
  enabled?: boolean;
  pageable?: Pageable;
}

/**
 * Hook to get likes for a comment
 */
export const useCommentLikes = (
  commentId: string | null | undefined,
  options: UseCommentLikesOptions = {}
) => {
  const { enabled = true, pageable = {} } = options;

  const query = useQuery({
    queryKey: [...queryKeys.comments.likes(commentId || ''), pageable],
    queryFn: () => commentLikeApi.getLikes(commentId!, pageable),
    enabled: enabled && !!commentId,
    staleTime: 1000 * 60 * 2,
  });

  return {
    data: query.data,
    likes: query.data?.content ?? [],
    totalElements: query.data?.totalElements ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for infinite scroll likes
 */
export const useInfiniteCommentLikes = (
  commentId: string | null | undefined,
  options: { enabled?: boolean; pageSize?: number } = {}
) => {
  const { enabled = true, pageSize = PAGINATION.USERS_SIZE } = options;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.comments.likes(commentId || ''), 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      commentLikeApi.getLikes(commentId!, { page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: enabled && !!commentId,
    staleTime: 1000 * 60 * 2,
  });

  const likes = query.data?.pages.flatMap((page) => page.content) ?? [];
  const totalElements = query.data?.pages[0]?.totalElements ?? 0;

  return {
    likes,
    totalElements,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
  };
};

export default useCommentLikes;