// src/modules/comment/hooks/useLikeComment.ts

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@/app/config/queryClient';
import { commentLikeApi } from '../api/commentLikeApi';
import type { CommentResponse, PageCommentResponse } from '../types/comment.types';

interface UseLikeCommentOptions {
  pinId?: string;
  parentId?: string;
  onSuccess?: (data: CommentResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Обновляет комментарий в списке комментариев (infinite query)
 */
const updateCommentInList = (
  data: InfiniteData<PageCommentResponse> | undefined,
  commentId: string,
  updatedComment: CommentResponse
): InfiniteData<PageCommentResponse> | undefined => {
  if (!data?.pages) return data;
  
  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      content: page.content.map(comment =>
        comment.id === commentId ? updatedComment : comment
      ),
    })),
  };
};

export const useLikeComment = (options: UseLikeCommentOptions = {}) => {
  const { pinId, parentId, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (commentId: string) => commentLikeApi.like(commentId),

    onSuccess: (updatedComment, commentId) => {
      // ✅ Обновляем кэш конкретного комментария
      queryClient.setQueryData(
        queryKeys.comments.byId(commentId), 
        updatedComment
      );
      
      // ✅ Обновляем комментарий в списке комментариев пина
      if (pinId) {
        queryClient.setQueryData<InfiniteData<PageCommentResponse>>(
          [...queryKeys.pins.comments(pinId), 'infinite'],
          (oldData) => updateCommentInList(oldData, commentId, updatedComment)
        );
      }

      // ✅ Обновляем комментарий в списке ответов
      if (parentId) {
        queryClient.setQueryData<InfiniteData<PageCommentResponse>>(
          [...queryKeys.comments.replies(parentId), 'infinite'],
          (oldData) => updateCommentInList(oldData, commentId, updatedComment)
        );
      }
      
      // Фоновая инвалидация
      void queryClient.invalidateQueries({ 
        queryKey: queryKeys.comments.likes(commentId),
        refetchType: 'none',
      });

      onSuccess?.(updatedComment);
    },

    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    likeComment: mutation.mutate,
    likeCommentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
};

export default useLikeComment;