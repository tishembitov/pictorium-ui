// src/modules/search/stores/searchPreferencesStore.ts

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { SearchSortBy, SearchSortOrder } from '../types/search.types';

interface SearchPreferencesState {
  // Saved preferences
  sortBy: SearchSortBy;
  sortOrder: SearchSortOrder;
  fuzzy: boolean;
  highlight: boolean;
  personalized: boolean;
  
  // Recent searches (local)
  recentSearches: string[];
  maxRecentSearches: number;
}

interface SearchPreferencesActions {
  setSortBy: (sortBy: SearchSortBy) => void;
  setSortOrder: (sortOrder: SearchSortOrder) => void;
  setFuzzy: (fuzzy: boolean) => void;
  setHighlight: (highlight: boolean) => void;
  setPersonalized: (personalized: boolean) => void;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  resetPreferences: () => void;
}

type SearchPreferencesStore = SearchPreferencesState & SearchPreferencesActions;

const DEFAULT_STATE: SearchPreferencesState = {
  sortBy: 'RELEVANCE',
  sortOrder: 'DESC',
  fuzzy: true,
  highlight: true,
  personalized: true,
  recentSearches: [],
  maxRecentSearches: 10,
};

export const useSearchPreferencesStore = create<SearchPreferencesStore>()(
  devtools(
    persist(
      (set) => ({
        ...DEFAULT_STATE,

        setSortBy: (sortBy) => set({ sortBy }, false, 'setSortBy'),
        
        setSortOrder: (sortOrder) => set({ sortOrder }, false, 'setSortOrder'),
        
        setFuzzy: (fuzzy) => set({ fuzzy }, false, 'setFuzzy'),
        
        setHighlight: (highlight) => set({ highlight }, false, 'setHighlight'),
        
        setPersonalized: (personalized) => set({ personalized }, false, 'setPersonalized'),
        
        addRecentSearch: (query) => {
          const trimmed = query.trim().toLowerCase();
          if (!trimmed) return;
          
          set((state) => {
            const filtered = state.recentSearches.filter(
              (q) => q.toLowerCase() !== trimmed
            );
            return {
              recentSearches: [query.trim(), ...filtered].slice(0, state.maxRecentSearches),
            };
          }, false, 'addRecentSearch');
        },
        
        removeRecentSearch: (query) => {
          set((state) => ({
            recentSearches: state.recentSearches.filter(
              (q) => q.toLowerCase() !== query.toLowerCase()
            ),
          }), false, 'removeRecentSearch');
        },
        
        clearRecentSearches: () => set({ recentSearches: [] }, false, 'clearRecentSearches'),
        
        resetPreferences: () => set(DEFAULT_STATE, false, 'resetPreferences'),
      }),
      {
        name: 'search-preferences',
        partialize: (state) => ({
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          fuzzy: state.fuzzy,
          highlight: state.highlight,
          personalized: state.personalized,
          recentSearches: state.recentSearches,
        }),
      }
    ),
    { name: 'SearchPreferencesStore' }
  )
);

// Selectors
export const selectSortBy = (state: SearchPreferencesStore) => state.sortBy;
export const selectSortOrder = (state: SearchPreferencesStore) => state.sortOrder;
export const selectRecentSearches = (state: SearchPreferencesStore) => state.recentSearches;

export default useSearchPreferencesStore;