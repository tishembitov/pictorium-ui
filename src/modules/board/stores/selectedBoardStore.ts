// src/modules/board/stores/selectedBoardStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/shared/utils/constants';
import type { BoardResponse } from '../types/board.types';

/**
 * Save target type:
 * - null: Save to Profile (default)
 * - BoardResponse: Save to specific board
 */
export type SaveTarget = BoardResponse | null;

interface SelectedBoardState {
  selectedBoard: SaveTarget;
  isLoading: boolean;
}

interface SelectedBoardActions {
  setSelectedBoard: (board: BoardResponse) => void;
  clearSelectedBoard: () => void; // Sets to null (Profile)
  setLoading: (loading: boolean) => void;
}

type SelectedBoardStore = SelectedBoardState & SelectedBoardActions;

const initialState: SelectedBoardState = {
  selectedBoard: null, // null = Profile is default
  isLoading: false,
};

export const useSelectedBoardStore = create<SelectedBoardStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setSelectedBoard: (board) =>
          set({ selectedBoard: board }, false, 'setSelectedBoard'),

        clearSelectedBoard: () =>
          set({ selectedBoard: null }, false, 'clearSelectedBoard'),

        setLoading: (isLoading) =>
          set({ isLoading }, false, 'setLoading'),
      }),
      {
        name: STORAGE_KEYS.SELECTED_BOARD,
        partialize: (state) => ({
          selectedBoard: state.selectedBoard,
        }),
      }
    ),
    { name: 'SelectedBoardStore' }
  )
);

// Selectors
export const selectSelectedBoard = (state: SelectedBoardStore) => state.selectedBoard;
export const selectIsLoading = (state: SelectedBoardStore) => state.isLoading;
export const selectHasSelectedBoard = (state: SelectedBoardStore) => state.selectedBoard !== null;
export const selectIsProfileMode = (state: SelectedBoardStore) => state.selectedBoard === null;

export default useSelectedBoardStore;