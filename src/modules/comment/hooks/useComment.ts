// src/modules/comment/hooks/useComment.ts

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentApi } from '../api/commentApi';

interface UseCommentOptions {
  enabled?: boolean;
}

/**
 * Hook to get a single comment by ID
 */
export const useComment = (
  commentId: string | null | undefined,
  options: UseCommentOptions = {}
) => {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: queryKeys.comments.byId(commentId || ''),
    queryFn: () => commentApi.getById(commentId!),
    enabled: enabled && !!commentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    comment: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useComment;