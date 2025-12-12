// src/shared/store/searchHistoryStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../utils/constants';

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

interface SearchHistoryState {
  history: SearchHistoryItem[];
  maxItems: number;
}

interface SearchHistoryActions {
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearHistory: () => void;
  getRecentSearches: (limit?: number) => SearchHistoryItem[];
}

type SearchHistoryStore = SearchHistoryState & SearchHistoryActions;

const DEFAULT_MAX_ITEMS = 10;

export const useSearchHistoryStore = create<SearchHistoryStore>()(
  devtools(
    persist(
      (set, get) => ({
        history: [],
        maxItems: DEFAULT_MAX_ITEMS,

        addSearch: (query) => {
          const trimmedQuery = query.trim().toLowerCase();
          if (!trimmedQuery) return;

          set((state) => {
            // Remove existing entry with same query
            const filteredHistory = state.history.filter(
              (item) => item.query.toLowerCase() !== trimmedQuery
            );

            // Add new entry at the beginning
            const newHistory = [
              { query: query.trim(), timestamp: Date.now() },
              ...filteredHistory,
            ].slice(0, state.maxItems);

            return { history: newHistory };
          }, false, 'addSearch');
        },

        removeSearch: (query) => {
          set((state) => ({
            history: state.history.filter(
              (item) => item.query.toLowerCase() !== query.toLowerCase()
            ),
          }), false, 'removeSearch');
        },

        clearHistory: () => {
          set({ history: [] }, false, 'clearHistory');
        },

        getRecentSearches: (limit) => {
          const { history, maxItems } = get();
          const effectiveLimit = limit ?? maxItems;
          return history.slice(0, effectiveLimit);
        },
      }),
      {
        name: STORAGE_KEYS.RECENT_SEARCHES,
        partialize: (state) => ({
          history: state.history,
        }),
      }
    ),
    { name: 'SearchHistoryStore' }
  )
);

// Selectors
export const selectSearchHistory = (state: SearchHistoryStore) => state.history;
export const selectHasSearchHistory = (state: SearchHistoryStore) => state.history.length > 0;

export default useSearchHistoryStore;