// src/modules/pin/stores/pinPreferencesStore.ts

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { PinSort, PinSortField, PinSortDirection } from '../types/pin.types';

interface PinPreferencesState {
  // Saved preferences
  sort: PinSort;
  
  // Actions
  setSort: (field: PinSortField, direction: PinSortDirection) => void;
  setSortFromValue: (value: string) => void;
  resetSort: () => void;
}

const DEFAULT_SORT: PinSort = { 
  field: 'createdAt', 
  direction: 'desc' 
};

export const usePinPreferencesStore = create<PinPreferencesState>()(
  devtools(
    persist(
      (set) => ({
        sort: DEFAULT_SORT,

        setSort: (field, direction) => 
          set({ sort: { field, direction } }, false, 'setSort'),

        setSortFromValue: (value) => {
          const sortMap: Record<string, PinSort> = {
            newest: { field: 'createdAt', direction: 'desc' },
            oldest: { field: 'createdAt', direction: 'asc' },
            popular: { field: 'likeCount', direction: 'desc' },
            saved: { field: 'saveCount', direction: 'desc' },
          };
          const sort = sortMap[value] ?? DEFAULT_SORT;
          set({ sort }, false, 'setSortFromValue');
        },

        resetSort: () => 
          set({ sort: DEFAULT_SORT }, false, 'resetSort'),
      }),
      { name: 'pin-preferences' }
    ),
    { name: 'PinPreferencesStore' }
  )
);

// Селекторы
export const selectSort = (state: PinPreferencesState) => state.sort;