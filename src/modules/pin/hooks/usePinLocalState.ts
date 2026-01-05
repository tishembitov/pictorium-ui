// src/modules/pin/hooks/usePinLocalState.ts

import { useState, useCallback, useMemo } from 'react';
import type { PinResponse } from '../types/pin.types';

export interface PinLocalState {
  isLiked: boolean;
  likeCount: number;
  isSaved: boolean;
  savedCount: number;
  lastSavedBoardId: string | null;
  lastSavedBoardName: string | null;
}

export interface SavedBoardInfo {
  boardId: string;
  boardName: string;
}

interface LocalOverride {
  isLiked?: boolean;
  likeCount?: number;
  isSaved?: boolean;
  savedCount?: number;
  lastSavedBoardId?: string | null;
  lastSavedBoardName?: string | null;
}

export interface UsePinLocalStateResult {
  state: PinLocalState;
  toggleLike: () => boolean;
  markAsSaved: (board: SavedBoardInfo) => void;
  markAsRemoved: (boardId: string, remainingBoards?: SavedBoardInfo[]) => void;
  resetOverride: () => void;
}

export const usePinLocalState = (pin: PinResponse | undefined): UsePinLocalStateResult => {
  const [override, setOverride] = useState<LocalOverride>({});

  // ✅ DEBUG
  console.log('[usePinLocalState] Input pin:', {
    id: pin?.id,
    isLiked: pin?.isLiked,
    likeCount: pin?.likeCount,
  });
  console.log('[usePinLocalState] Override:', override);

  const state: PinLocalState = useMemo(() => {
    const result = {
      isLiked: override.isLiked ?? pin?.isLiked ?? false,
      likeCount: override.likeCount ?? pin?.likeCount ?? 0,
      isSaved: override.isSaved ?? ((pin?.savedToBoardsCount ?? 0) > 0),
      savedCount: override.savedCount ?? pin?.savedToBoardsCount ?? 0,
      lastSavedBoardId: override.lastSavedBoardId !== undefined 
        ? override.lastSavedBoardId 
        : (pin?.lastSavedBoardId ?? null),
      lastSavedBoardName: override.lastSavedBoardName !== undefined 
        ? override.lastSavedBoardName 
        : (pin?.lastSavedBoardName ?? null),
    };
    
    // ✅ DEBUG
    console.log('[usePinLocalState] Computed state:', {
      isLiked: result.isLiked,
      likeCount: result.likeCount,
    });
    
    return result;
  }, [override, pin]);

  const toggleLike = useCallback((): boolean => {
    const currentIsLiked = override.isLiked ?? pin?.isLiked ?? false;
    const currentCount = override.likeCount ?? pin?.likeCount ?? 0;
    const newIsLiked = !currentIsLiked;
    
    setOverride(prev => ({
      ...prev,
      isLiked: newIsLiked,
      likeCount: newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
    }));
    
    return newIsLiked;
  }, [override.isLiked, override.likeCount, pin?.isLiked, pin?.likeCount]);

  const markAsSaved = useCallback((board: SavedBoardInfo) => {
    const currentCount = override.savedCount ?? pin?.savedToBoardsCount ?? 0;
    
    setOverride(prev => ({
      ...prev,
      isSaved: true,
      savedCount: currentCount + 1,
      lastSavedBoardId: board.boardId,
      lastSavedBoardName: board.boardName,
    }));
  }, [override.savedCount, pin?.savedToBoardsCount]);

  const markAsRemoved = useCallback((
    boardId: string,
    remainingBoards?: SavedBoardInfo[]
  ) => {
    const currentCount = override.savedCount ?? pin?.savedToBoardsCount ?? 0;
    const currentLastId = override.lastSavedBoardId !== undefined 
      ? override.lastSavedBoardId 
      : pin?.lastSavedBoardId;
    
    const newCount = Math.max(0, currentCount - 1);
    
    if (newCount === 0) {
      setOverride(prev => ({
        ...prev,
        isSaved: false,
        savedCount: 0,
        lastSavedBoardId: null,
        lastSavedBoardName: null,
      }));
      return;
    }
    
    if (currentLastId === boardId && remainingBoards?.length) {
      const newLast = remainingBoards[0];
      setOverride(prev => ({
        ...prev,
        savedCount: newCount,
        lastSavedBoardId: newLast?.boardId ?? null,
        lastSavedBoardName: newLast?.boardName ?? null,
      }));
      return;
    }
    
    setOverride(prev => ({
      ...prev,
      savedCount: newCount,
    }));
  }, [override.savedCount, override.lastSavedBoardId, pin?.savedToBoardsCount, pin?.lastSavedBoardId]);

  const resetOverride = useCallback(() => {
    setOverride({});
  }, []);

  return useMemo(() => ({
    state,
    toggleLike,
    markAsSaved,
    markAsRemoved,
    resetOverride,
  }), [state, toggleLike, markAsSaved, markAsRemoved, resetOverride]);
};

export default usePinLocalState;