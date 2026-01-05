// src/modules/comment/hooks/useCommentLocalState.ts

import { useState, useCallback, useMemo } from 'react';
import type { CommentResponse } from '../types/comment.types';

export interface CommentLocalState {
  isLiked: boolean;
  likeCount: number;
  replyCount: number;
  isDeleted: boolean;
}

interface LocalOverride {
  isLiked?: boolean;
  likeCount?: number;
  replyCount?: number;
  isDeleted?: boolean;
}

export interface UseCommentLocalStateResult {
  state: CommentLocalState;
  toggleLike: () => boolean;
  incrementReplyCount: () => void;
  markAsDeleted: () => void;
  resetOverride: () => void;
}

/**
 * Локальное состояние комментария.
 * Использует серверные данные как базу, локальный override для мгновенного UI.
 */
export const useCommentLocalState = (
  comment: CommentResponse | undefined
): UseCommentLocalStateResult => {
  const [override, setOverride] = useState<LocalOverride>({});

  // Вычисляем итоговое состояние: override ?? server
  const state: CommentLocalState = useMemo(() => ({
    isLiked: override.isLiked ?? comment?.isLiked ?? false,
    likeCount: override.likeCount ?? comment?.likeCount ?? 0,
    replyCount: override.replyCount ?? comment?.replyCount ?? 0,
    isDeleted: override.isDeleted ?? false,
  }), [override, comment]);

  const toggleLike = useCallback((): boolean => {
    const currentIsLiked = override.isLiked ?? comment?.isLiked ?? false;
    const currentCount = override.likeCount ?? comment?.likeCount ?? 0;
    const newIsLiked = !currentIsLiked;
    
    setOverride(prev => ({
      ...prev,
      isLiked: newIsLiked,
      likeCount: newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
    }));
    
    return newIsLiked;
  }, [override.isLiked, override.likeCount, comment?.isLiked, comment?.likeCount]);

  const incrementReplyCount = useCallback(() => {
    const currentCount = override.replyCount ?? comment?.replyCount ?? 0;
    
    setOverride(prev => ({
      ...prev,
      replyCount: currentCount + 1,
    }));
  }, [override.replyCount, comment?.replyCount]);

  const markAsDeleted = useCallback(() => {
    setOverride(prev => ({
      ...prev,
      isDeleted: true,
    }));
  }, []);

  const resetOverride = useCallback(() => {
    setOverride({});
  }, []);

  return useMemo(() => ({
    state,
    toggleLike,
    incrementReplyCount,
    markAsDeleted,
    resetOverride,
  }), [state, toggleLike, incrementReplyCount, markAsDeleted, resetOverride]);
};

export default useCommentLocalState;