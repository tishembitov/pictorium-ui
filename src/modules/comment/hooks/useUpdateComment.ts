// src/modules/comment/hooks/useUpdateComment.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentApi } from '../api/commentApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import type { CommentUpdateRequest, CommentResponse } from '../types/comment.types';

interface UseUpdateCommentOptions {
  onSuccess?: (data: CommentResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Hook to update a comment
 */
export const useUpdateComment = (options: UseUpdateCommentOptions = {}) => {
  const { onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: ({
      commentId,
      data,
    }: {
      commentId: string;
      data: CommentUpdateRequest;
    }) => commentApi.update(commentId, data),
    onSuccess: (data, variables) => {
      // Invalidate comment
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byId(variables.commentId),
      });
      // Invalidate pin comments if we know the pinId
      if (data.pinId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.pins.comments(data.pinId),
        });
      }

      if (showToast) {
        toast.success(SUCCESS_MESSAGES.COMMENT_UPDATED);
      }

      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to update comment');
      }

      onError?.(error);
    },
  });

  return {
    updateComment: mutation.mutate,
    updateCommentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
};

export default useUpdateComment;