// src/modules/comment/hooks/useCommentReplies.ts

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentApi } from '../api/commentApi';
import type { Pageable } from '@/shared/types/pageable.types';
import { PAGINATION } from '@/shared/utils/constants';

interface UseCommentRepliesOptions {
  enabled?: boolean;
  pageable?: Pageable;
}

/**
 * Hook to get replies to a comment (paginated)
 */
export const useCommentReplies = (
  commentId: string | null | undefined,
  options: UseCommentRepliesOptions = {}
) => {
  const { enabled = true, pageable = {} } = options;

  const query = useQuery({
    queryKey: [...queryKeys.comments.replies(commentId || ''), pageable],
    queryFn: () => commentApi.getReplies(commentId!, pageable),
    enabled: enabled && !!commentId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    data: query.data,
    replies: query.data?.content ?? [],
    totalElements: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook for infinite scroll replies
 */
export const useInfiniteCommentReplies = (
  commentId: string | null | undefined,
  options: { enabled?: boolean; pageSize?: number } = {}
) => {
  const { enabled = true, pageSize = PAGINATION.COMMENTS_SIZE } = options;

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.comments.replies(commentId || ''), 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      commentApi.getReplies(commentId!, { page: pageParam, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: enabled && !!commentId,
    staleTime: 1000 * 60 * 2,
  });

  const replies = query.data?.pages.flatMap((page) => page.content) ?? [];
  const totalElements = query.data?.pages[0]?.totalElements ?? 0;

  return {
    replies,
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

export default useCommentReplies;