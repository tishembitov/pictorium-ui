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

/**
 * Единое локальное состояние пина.
 * Использует серверные данные как базу, локальный override для мгновенного UI.
 */
export const usePinLocalState = (pin: PinResponse | undefined): UsePinLocalStateResult => {
  const [override, setOverride] = useState<LocalOverride>({});

  // Вычисляем итоговое состояние: override ?? server
  const state: PinLocalState = useMemo(() => ({
    isLiked: override.isLiked ?? pin?.isLiked ?? false,
    likeCount: override.likeCount ?? pin?.likeCount ?? 0,
    isSaved: override.isSaved ?? ((pin?.savedToBoardsCount ?? 0) > 0),
    savedCount: override.savedCount ?? pin?.savedToBoardsCount ?? 0,
    lastSavedBoardId: override.lastSavedBoardId === undefined 
      ? (pin?.lastSavedBoardId ?? null) 
      : override.lastSavedBoardId,
    lastSavedBoardName: override.lastSavedBoardName === undefined 
      ? (pin?.lastSavedBoardName ?? null) 
      : override.lastSavedBoardName,
  }), [override, pin]);

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
    const currentLastId = override.lastSavedBoardId === undefined 
      ? pin?.lastSavedBoardId 
      : override.lastSavedBoardId;
    
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