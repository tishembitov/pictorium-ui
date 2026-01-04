// src/modules/pin/hooks/usePinSaveState.ts

import { useState, useCallback, useMemo } from 'react';

export interface PinSaveState {
  isSaved: boolean;
  count: number;
  lastBoardId: string | null;
  lastBoardName: string | null;
}

export interface SavedBoard {
  boardId: string;
  boardName: string;
}

interface UsePinSaveStateProps {
  initialSavedToBoardsCount: number;
  initialLastSavedBoardId: string | null;
  initialLastSavedBoardName: string | null;
}

interface UsePinSaveStateResult {
  // State
  saveState: PinSaveState;
  isSaved: boolean;
  
  // Immediate UI updates (call BEFORE mutation)
  markAsSaved: (board: SavedBoard) => void;
  markAsRemoved: (boardId: string, remainingBoards?: SavedBoard[]) => void;
  
  // Sync with server data (call on query refetch)
  syncWithServer: (serverData: {
    savedToBoardsCount: number;
    lastSavedBoardId: string | null;
    lastSavedBoardName: string | null;
  }) => void;
  
  // Reset to initial
  reset: () => void;
}

/**
 * Локальное состояние сохранения пина.
 * Обновляется мгновенно при действиях пользователя,
 * синхронизируется с сервером в фоне.
 */
export const usePinSaveState = ({
  initialSavedToBoardsCount,
  initialLastSavedBoardId,
  initialLastSavedBoardName,
}: UsePinSaveStateProps): UsePinSaveStateResult => {
  
  const [saveState, setSaveState] = useState<PinSaveState>(() => ({
    isSaved: initialSavedToBoardsCount > 0,
    count: initialSavedToBoardsCount,
    lastBoardId: initialLastSavedBoardId,
    lastBoardName: initialLastSavedBoardName,
  }));

  const isSaved = saveState.isSaved;

  /**
   * Мгновенно обновляет UI после сохранения в доску
   */
  const markAsSaved = useCallback((board: SavedBoard) => {
    setSaveState(prev => ({
      isSaved: true,
      count: prev.count + 1,
      lastBoardId: board.boardId,
      lastBoardName: board.boardName,
    }));
  }, []);

  /**
   * Мгновенно обновляет UI после удаления из доски
   */
  const markAsRemoved = useCallback((
    boardId: string, 
    remainingBoards?: SavedBoard[]
  ) => {
    setSaveState(prev => {
      const newCount = Math.max(0, prev.count - 1);
      
      // Если удалили последнюю доску
      if (newCount === 0) {
        return {
          isSaved: false,
          count: 0,
          lastBoardId: null,
          lastBoardName: null,
        };
      }
      
      // Если удалили текущую "последнюю" доску - берём из remaining
      if (prev.lastBoardId === boardId && remainingBoards?.length) {
        const newLast = remainingBoards[0];
        return {
          isSaved: true,
          count: newCount,
          lastBoardId: newLast?.boardId ?? null,
          lastBoardName: newLast?.boardName ?? null,
        };
      }
      
      // Удалили другую доску - lastBoard остаётся
      return {
        ...prev,
        count: newCount,
      };
    });
  }, []);

  /**
   * Синхронизация с данными сервера (вызывается при refetch)
   */
  const syncWithServer = useCallback((serverData: {
    savedToBoardsCount: number;
    lastSavedBoardId: string | null;
    lastSavedBoardName: string | null;
  }) => {
    setSaveState({
      isSaved: serverData.savedToBoardsCount > 0,
      count: serverData.savedToBoardsCount,
      lastBoardId: serverData.lastSavedBoardId,
      lastBoardName: serverData.lastSavedBoardName,
    });
  }, []);

  /**
   * Сброс к начальным значениям
   */
  const reset = useCallback(() => {
    setSaveState({
      isSaved: initialSavedToBoardsCount > 0,
      count: initialSavedToBoardsCount,
      lastBoardId: initialLastSavedBoardId,
      lastBoardName: initialLastSavedBoardName,
    });
  }, [initialSavedToBoardsCount, initialLastSavedBoardId, initialLastSavedBoardName]);

  return useMemo(() => ({
    saveState,
    isSaved,
    markAsSaved,
    markAsRemoved,
    syncWithServer,
    reset,
  }), [saveState, isSaved, markAsSaved, markAsRemoved, syncWithServer, reset]);
};

export default usePinSaveState;