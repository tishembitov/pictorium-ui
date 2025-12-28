// src/modules/comment/hooks/useCreateReply.ts

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentApi } from '../api/commentApi';
import { useToast } from '@/shared/hooks/useToast';
import { SUCCESS_MESSAGES } from '@/shared/utils/constants';
import type { CommentCreateRequest, CommentResponse, PageCommentResponse } from '../types/comment.types';

interface UseCreateReplyOptions {
  pinId?: string;
  onSuccess?: (data: CommentResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

/**
 * Updates parent comment's replyCount in pages
 */
const updateParentReplyCountInPages = (
  data: InfiniteData<PageCommentResponse> | undefined,
  parentCommentId: string,
  delta: number
): InfiniteData<PageCommentResponse> | undefined => {
  if (!data?.pages) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      content: page.content.map((comment) =>
        comment.id === parentCommentId
          ? { ...comment, replyCount: Math.max(0, comment.replyCount + delta) }
          : comment
      ),
    })),
  };
};

/**
 * Hook to create a reply to a comment
 */
export const useCreateReply = (
  commentId: string,
  options: UseCreateReplyOptions = {}
) => {
  const { pinId, onSuccess, onError, showToast = true } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: CommentCreateRequest) =>
      commentApi.createReply(commentId, data),
    onSuccess: (data) => {
      // Invalidate replies
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.replies(commentId),
      });

      // Update parent comment's replyCount in single comment cache
      const parentComment = queryClient.getQueryData<CommentResponse>(
        queryKeys.comments.byId(commentId)
      );
      if (parentComment) {
        queryClient.setQueryData<CommentResponse>(
          queryKeys.comments.byId(commentId),
          {
            ...parentComment,
            replyCount: parentComment.replyCount + 1,
          }
        );
      }

      // Update parent's replyCount in pin comments list
      if (pinId) {
        queryClient.setQueryData<InfiniteData<PageCommentResponse>>(
          [...queryKeys.pins.comments(pinId), 'infinite'],
          (oldData) => updateParentReplyCountInPages(oldData, commentId, 1)
        );
      }

      if (showToast) {
        toast.success(SUCCESS_MESSAGES.COMMENT_CREATED);
      }

      onSuccess?.(data);
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || 'Failed to create reply');
      }

      onError?.(error);
    },
  });

  return {
    createReply: mutation.mutate,
    createReplyAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
};

export default useCreateReply;