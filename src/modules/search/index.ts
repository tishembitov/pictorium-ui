// src/modules/search/index.ts

// Types
export type {
    SearchSortBy,
    SearchSortOrder,
    SearchType,
    SuggestionType,
    SearchCriteria,
    PinSearchParams,
    UserSearchParams,
    BoardSearchParams,
    Highlights,
    TagCount,
    AuthorCount,
    Aggregations,
    PinSearchResult,
    UserSearchResult,
    BoardSearchResult,
    SearchResult,
    PinSearchResponse,
    UserSearchResponse,
    BoardSearchResponse,
    UniversalSearchResponse,
    Suggestion,
    SuggestResponse,
    TrendingQuery,
    SearchHistoryItem,
    SearchFiltersState,
    SearchSortOption,
  } from './types/search.types';
  
  // API
  export { searchApi } from './api/searchApi';
  
  // Hooks
  export { useSearchPins } from './hooks/useSearchPins';
  export { useSearchUsers } from './hooks/useSearchUsers';
  export { useSearchBoards } from './hooks/useSearchBoards';
  export { useUniversalSearch } from './hooks/useUniversalSearch';
  export { useSimilarPins } from './hooks/useSimilarPins';
  export { useSuggestions } from './hooks/useSuggestions';
  export { useTrending } from './hooks/useTrending';
  export { useSearchHistory } from './hooks/useSearchHistory';
  export { useClearSearchHistory } from './hooks/useClearSearchHistory';
  
  // Store
  export {
    useSearchPreferencesStore,
    selectSortBy,
    selectSortOrder,
    selectRecentSearches,
  } from './stores/searchPreferencesStore';
  
  // Components
  export { SearchFilters } from './components/SearchFilters';
  export { SearchSortSelect } from './components/SearchSortSelect';
  export { SearchDateRangePicker } from './components/SearchDateRangePicker';
  export { SearchAggregations } from './components/SearchAggregations';
  export { SearchResultsHeader } from './components/SearchResultsHeader';
  export { SearchPinCard } from './components/SearchPinCard';
  export { SearchUserCard } from './components/SearchUserCard';
  export { SearchBoardCard } from './components/SearchBoardCard';
  export { SearchPinGrid } from './components/SearchPinGrid';
  export { SuggestionDropdown } from './components/SuggestionDropdown';
  export { UniversalSearchResults } from './components/UniversalSearchResults';
  
  // Utils
  export {
    SEARCH_SORT_OPTIONS,
    getSortOption,
    getHighlightedText,
    hasHighlights,
    formatTookTime,
    formatTotalHits,
    buildSearchUrl,
    parseSearchUrl,
    sanitizeSearchQuery,
  } from './utils/searchUtils';