// src/modules/pin/stores/pinFiltersStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { PinFilter, PinScope, PinSortField, PinSortDirection } from '../types/pinFilter.types';

interface PinFiltersState {
  // Filter state
  filter: PinFilter;
  
  // Sort state
  sortField: PinSortField;
  sortDirection: PinSortDirection;
  
  // UI state
  isFilterPanelOpen: boolean;
}

interface PinFiltersActions {
  // Filter actions
  setFilter: (filter: Partial<PinFilter>) => void;
  setQuery: (q: string) => void;
  setTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setScope: (scope: PinScope) => void;
  setAuthorId: (authorId: string | undefined) => void;
  setDateRange: (from?: string, to?: string) => void;
  clearFilter: () => void;
  
  // Sort actions
  setSort: (field: PinSortField, direction: PinSortDirection) => void;
  toggleSortDirection: () => void;
  
  // UI actions
  toggleFilterPanel: () => void;
  setFilterPanelOpen: (open: boolean) => void;
  
  // Computed
  hasActiveFilters: () => boolean;
  getActiveFilterCount: () => number;
}

type PinFiltersStore = PinFiltersState & PinFiltersActions;

const initialFilter: PinFilter = {};

const initialState: PinFiltersState = {
  filter: initialFilter,
  sortField: 'createdAt',
  sortDirection: 'desc',
  isFilterPanelOpen: false,
};

export const usePinFiltersStore = create<PinFiltersStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Filter actions
        setFilter: (newFilter) =>
          set(
            (state) => ({ filter: { ...state.filter, ...newFilter } }),
            false,
            'setFilter'
          ),

        setQuery: (q) =>
          set(
            (state) => ({ filter: { ...state.filter, q: q || undefined } }),
            false,
            'setQuery'
          ),

        setTags: (tags) =>
          set(
            (state) => ({ filter: { ...state.filter, tags: tags.length ? tags : undefined } }),
            false,
            'setTags'
          ),

        addTag: (tag) =>
          set(
            (state) => {
              const currentTags = state.filter.tags || [];
              if (currentTags.includes(tag)) return state;
              return { filter: { ...state.filter, tags: [...currentTags, tag] } };
            },
            false,
            'addTag'
          ),

        removeTag: (tag) =>
          set(
            (state) => {
              const currentTags = state.filter.tags || [];
              const newTags = currentTags.filter((t) => t !== tag);
              return { filter: { ...state.filter, tags: newTags.length ? newTags : undefined } };
            },
            false,
            'removeTag'
          ),

        setScope: (scope) =>
          set(
            (state) => ({ filter: { ...state.filter, scope } }),
            false,
            'setScope'
          ),

        setAuthorId: (authorId) =>
          set(
            (state) => ({ filter: { ...state.filter, authorId } }),
            false,
            'setAuthorId'
          ),

        setDateRange: (createdFrom, createdTo) =>
          set(
            (state) => ({ filter: { ...state.filter, createdFrom, createdTo } }),
            false,
            'setDateRange'
          ),

        clearFilter: () =>
          set({ filter: initialFilter }, false, 'clearFilter'),

        // Sort actions
        setSort: (field, direction) =>
          set({ sortField: field, sortDirection: direction }, false, 'setSort'),

        toggleSortDirection: () =>
          set(
            (state) => ({
              sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
            }),
            false,
            'toggleSortDirection'
          ),

        // UI actions
        toggleFilterPanel: () =>
          set(
            (state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen }),
            false,
            'toggleFilterPanel'
          ),

        setFilterPanelOpen: (open) =>
          set({ isFilterPanelOpen: open }, false, 'setFilterPanelOpen'),

        // Computed
        hasActiveFilters: () => {
          const { filter } = get();
          return !!(
            filter.q ||
            filter.tags?.length ||
            filter.authorId ||
            filter.savedBy ||
            filter.likedBy ||
            filter.createdFrom ||
            filter.createdTo
          );
        },

        getActiveFilterCount: () => {
          const { filter } = get();
          let count = 0;
          if (filter.q) count++;
          if (filter.tags?.length) count++;
          if (filter.authorId) count++;
          if (filter.savedBy) count++;
          if (filter.likedBy) count++;
          if (filter.createdFrom || filter.createdTo) count++;
          return count;
        },
      }),
      {
        name: 'pin-filters',
        partialize: (state) => ({
          sortField: state.sortField,
          sortDirection: state.sortDirection,
        }),
      }
    ),
    { name: 'PinFiltersStore' }
  )
);

// Selectors
export const selectFilter = (state: PinFiltersStore) => state.filter;
export const selectSort = (state: PinFiltersStore) => ({
  field: state.sortField,
  direction: state.sortDirection,
});
export const selectIsFilterPanelOpen = (state: PinFiltersStore) => state.isFilterPanelOpen;
export const selectHasActiveFilters = (state: PinFiltersStore) => state.hasActiveFilters();

export default usePinFiltersStore;