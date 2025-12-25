// src/modules/pin/stores/pinFiltersStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  PinFilter, 
  PinScope, 
  PinSortField, 
  PinSortDirection 
} from '../types/pinFilter.types';

interface PinFiltersState {
  // Filter state
  filter: PinFilter;
  
  // Sort state
  sortField: PinSortField;
  sortDirection: PinSortDirection;
  
  // UI state
  isFilterPanelOpen: boolean;
  
  // Context for user-specific filtering
  contextUserId: string | null;
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
  setSavedBy: (userId: string | undefined) => void;
  setSavedToProfileBy: (userId: string | undefined) => void;
  setLikedBy: (userId: string | undefined) => void;
  setRelatedTo: (pinId: string | undefined) => void;
  setDateRange: (from?: string, to?: string) => void;
  clearFilter: () => void;
  resetToScope: (scope: PinScope) => void;
  
  // Context actions
  setContextUserId: (userId: string | null) => void;
  setUserScope: (userId: string, scope: PinScope) => void;
  
  // Sort actions
  setSort: (field: PinSortField, direction: PinSortDirection) => void;
  toggleSortDirection: () => void;
  
  // UI actions
  toggleFilterPanel: () => void;
  setFilterPanelOpen: (open: boolean) => void;
}

type PinFiltersStore = PinFiltersState & PinFiltersActions;

const initialFilter: PinFilter = {
  scope: 'ALL',
};

const initialState: PinFiltersState = {
  filter: initialFilter,
  sortField: 'createdAt',
  sortDirection: 'desc',
  isFilterPanelOpen: false,
  contextUserId: null,
};

export const usePinFiltersStore = create<PinFiltersStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // ==================== Filter Actions ====================
        
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
            (state) => ({ 
              filter: { ...state.filter, tags: tags.length ? tags : undefined } 
            }),
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
              return { 
                filter: { ...state.filter, tags: newTags.length ? newTags : undefined } 
              };
            },
            false,
            'removeTag'
          ),

        setScope: (scope) =>
          set(
            (state) => {
              const newFilter: PinFilter = { 
                ...state.filter, 
                scope,
                savedBy: undefined,
                savedToProfileBy: undefined,
                likedBy: undefined,
                authorId: undefined,
                relatedTo: undefined,
              };
              
              const userId = state.contextUserId;
              if (userId) {
                switch (scope) {
                  case 'CREATED':
                    newFilter.authorId = userId;
                    break;
                  case 'SAVED':
                    newFilter.savedBy = userId;
                    break;
                  case 'SAVED_TO_PROFILE':
                    newFilter.savedToProfileBy = userId;
                    break;
                  case 'SAVED_ALL':
                    newFilter.savedBy = userId;
                    break;
                  case 'LIKED':
                    newFilter.likedBy = userId;
                    break;
                }
              }
              
              return { filter: newFilter };
            },
            false,
            'setScope'
          ),

        setAuthorId: (authorId) =>
          set(
            (state) => ({ filter: { ...state.filter, authorId } }),
            false,
            'setAuthorId'
          ),

        setSavedBy: (savedBy) =>
          set(
            (state) => ({ filter: { ...state.filter, savedBy } }),
            false,
            'setSavedBy'
          ),

        setSavedToProfileBy: (savedToProfileBy) =>
          set(
            (state) => ({ filter: { ...state.filter, savedToProfileBy } }),
            false,
            'setSavedToProfileBy'
          ),

        setLikedBy: (likedBy) =>
          set(
            (state) => ({ filter: { ...state.filter, likedBy } }),
            false,
            'setLikedBy'
          ),

        setRelatedTo: (relatedTo) =>
          set(
            (state) => ({ 
              filter: { ...state.filter, relatedTo, scope: relatedTo ? 'RELATED' : undefined } 
            }),
            false,
            'setRelatedTo'
          ),

        setDateRange: (createdFrom, createdTo) =>
          set(
            (state) => ({ filter: { ...state.filter, createdFrom, createdTo } }),
            false,
            'setDateRange'
          ),

        clearFilter: () =>
          set({ filter: initialFilter, contextUserId: null }, false, 'clearFilter'),

        resetToScope: (scope) =>
          set(
            { 
              filter: { scope },
              contextUserId: null,
            }, 
            false, 
            'resetToScope'
          ),

        // ==================== Context Actions ====================

        setContextUserId: (userId) =>
          set({ contextUserId: userId }, false, 'setContextUserId'),

        setUserScope: (userId, scope) =>
          set(
            () => {
              const newFilter: PinFilter = { scope };
              
              switch (scope) {
                case 'CREATED':
                  newFilter.authorId = userId;
                  break;
                case 'SAVED':
                  newFilter.savedBy = userId;
                  break;
                case 'SAVED_TO_PROFILE':
                  newFilter.savedToProfileBy = userId;
                  break;
                case 'SAVED_ALL':
                  newFilter.savedBy = userId;
                  break;
                case 'LIKED':
                  newFilter.likedBy = userId;
                  break;
              }
              
              return { filter: newFilter, contextUserId: userId };
            },
            false,
            'setUserScope'
          ),

        // ==================== Sort Actions ====================

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

        // ==================== UI Actions ====================

        toggleFilterPanel: () =>
          set(
            (state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen }),
            false,
            'toggleFilterPanel'
          ),

        setFilterPanelOpen: (open) =>
          set({ isFilterPanelOpen: open }, false, 'setFilterPanelOpen'),
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

// ==================== Selectors (стабильные) ====================

export const selectFilter = (state: PinFiltersStore) => state.filter;
export const selectSortField = (state: PinFiltersStore) => state.sortField;
export const selectSortDirection = (state: PinFiltersStore) => state.sortDirection;
export const selectIsFilterPanelOpen = (state: PinFiltersStore) => state.isFilterPanelOpen;
export const selectContextUserId = (state: PinFiltersStore) => state.contextUserId;

export default usePinFiltersStore;