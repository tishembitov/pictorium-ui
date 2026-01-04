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

export interface UsePinLocalStateResult {
  state: PinLocalState;
  toggleLike: () => boolean;
  markAsSaved: (board: SavedBoardInfo) => void;
  markAsRemoved: (boardId: string, remainingBoards?: SavedBoardInfo[]) => void;
  syncWithPin: (pin: PinResponse) => void;
}

/**
 * Единое локальное состояние пина.
 */
export const usePinLocalState = (pin: PinResponse | undefined): UsePinLocalStateResult => {
  const [state, setState] = useState<PinLocalState>(() => ({
    isLiked: pin?.isLiked ?? false,
    likeCount: pin?.likeCount ?? 0,
    isSaved: (pin?.savedToBoardsCount ?? 0) > 0,
    savedCount: pin?.savedToBoardsCount ?? 0,
    lastSavedBoardId: pin?.lastSavedBoardId ?? null,
    lastSavedBoardName: pin?.lastSavedBoardName ?? null,
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

  const markAsSaved = useCallback((board: SavedBoardInfo) => {
    setState(prev => ({
      ...prev,
      isSaved: true,
      savedCount: prev.savedCount + 1,
      lastSavedBoardId: board.boardId,
      lastSavedBoardName: board.boardName,
    }));
  }, []);

  const markAsRemoved = useCallback((
    boardId: string,
    remainingBoards?: SavedBoardInfo[]
  ) => {
    setState(prev => {
      const newCount = Math.max(0, prev.savedCount - 1);
      
      if (newCount === 0) {
        return {
          ...prev,
          isSaved: false,
          savedCount: 0,
          lastSavedBoardId: null,
          lastSavedBoardName: null,
        };
      }
      
      if (prev.lastSavedBoardId === boardId && remainingBoards?.length) {
        const newLast = remainingBoards[0];
        return {
          ...prev,
          savedCount: newCount,
          lastSavedBoardId: newLast?.boardId ?? null,
          lastSavedBoardName: newLast?.boardName ?? null,
        };
      }
      
      return {
        ...prev,
        savedCount: newCount,
      };
    });
  }, []);

  const syncWithPin = useCallback((newPin: PinResponse) => {
    setState({
      isLiked: newPin.isLiked,
      likeCount: newPin.likeCount ?? 0,
      isSaved: (newPin.savedToBoardsCount ?? 0) > 0,
      savedCount: newPin.savedToBoardsCount ?? 0,
      lastSavedBoardId: newPin.lastSavedBoardId,
      lastSavedBoardName: newPin.lastSavedBoardName,
    });
  }, []);

  return useMemo(() => ({
    state,
    toggleLike,
    markAsSaved,
    markAsRemoved,
    syncWithPin,
  }), [state, toggleLike, markAsSaved, markAsRemoved, syncWithPin]);
};

export default usePinLocalState;