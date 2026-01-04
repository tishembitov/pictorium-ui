// src/modules/pin/hooks/usePinLikeState.ts

import { useState, useCallback, useMemo } from 'react';

interface UsePinLikeStateProps {
  initialIsLiked: boolean;
  initialLikeCount: number;
}

interface UsePinLikeStateResult {
  isLiked: boolean;
  likeCount: number;
  toggleLike: () => { newIsLiked: boolean };
  syncWithServer: (isLiked: boolean, likeCount: number) => void;
}

/**
 * Локальное состояние лайка пина.
 */
export const usePinLikeState = ({
  initialIsLiked,
  initialLikeCount,
}: UsePinLikeStateProps): UsePinLikeStateResult => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const toggleLike = useCallback(() => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount((prev) => (newIsLiked ? prev + 1 : Math.max(0, prev - 1)));
    return { newIsLiked };
  }, [isLiked]);

  const syncWithServer = useCallback((serverIsLiked: boolean, serverLikeCount: number) => {
    setIsLiked(serverIsLiked);
    setLikeCount(serverLikeCount);
  }, []);

  return useMemo(() => ({
    isLiked,
    likeCount,
    toggleLike,
    syncWithServer,
  }), [isLiked, likeCount, toggleLike, syncWithServer]);
};

export default usePinLikeState;