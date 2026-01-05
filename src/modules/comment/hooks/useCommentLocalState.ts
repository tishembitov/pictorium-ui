// src/modules/comment/hooks/useCommentLocalState.ts

import { useState, useCallback, useMemo } from 'react';
import type { CommentResponse } from '../types/comment.types';

export interface CommentLocalState {
  isLiked: boolean;
  likeCount: number;
  replyCount: number;
  isDeleted: boolean;
}

export interface UseCommentLocalStateResult {
  state: CommentLocalState;
  toggleLike: () => boolean;
  incrementReplyCount: () => void;
  markAsDeleted: () => void;
  syncWithComment: (comment: CommentResponse) => void;
}

/**
 * Локальное состояние комментария для оптимистичных обновлений UI.
 */
export const useCommentLocalState = (
  comment: CommentResponse | undefined
): UseCommentLocalStateResult => {
  const [state, setState] = useState<CommentLocalState>(() => ({
    isLiked: comment?.isLiked ?? false,
    likeCount: comment?.likeCount ?? 0,
    replyCount: comment?.replyCount ?? 0,
    isDeleted: false,
  }));

  const toggleLike = useCallback((): boolean => {
    let newIsLiked = false;
    setState(prev => {
      newIsLiked = !prev.isLiked;
      return {
        ...prev,
        isLiked: newIsLiked,
        likeCount: newIsLiked 
          ? prev.likeCount + 1 
          : Math.max(0, prev.likeCount - 1),
      };
    });
    return newIsLiked;
  }, []);

  const incrementReplyCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      replyCount: prev.replyCount + 1,
    }));
  }, []);

  const markAsDeleted = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDeleted: true,
    }));
  }, []);

  const syncWithComment = useCallback((newComment: CommentResponse) => {
    setState({
      isLiked: newComment.isLiked,
      likeCount: newComment.likeCount,
      replyCount: newComment.replyCount,
      isDeleted: false,
    });
  }, []);

  return useMemo(() => ({
    state,
    toggleLike,
    incrementReplyCount,
    markAsDeleted,
    syncWithComment,
  }), [state, toggleLike, incrementReplyCount, markAsDeleted, syncWithComment]);
};

export default useCommentLocalState;