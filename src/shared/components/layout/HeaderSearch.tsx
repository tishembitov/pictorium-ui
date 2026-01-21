// src/shared/components/layout/HeaderSearch.tsx

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Icon, TapArea, Layer, FixedZIndex } from 'gestalt';
import { SearchDropdown } from './SearchDropdown';
import {
  useSuggestions,
  useTrending,
  useSearchPreferencesStore,
} from '@/modules/search';
import { useCategories } from '@/modules/tag';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Z_INDEX } from '@/shared/utils/constants';

// ============ Styles ============
const styles = {
  input: (isFocused: boolean) => ({
    width: '100%',
    height: '52px',
    padding: '0 52px 0 56px',
    borderRadius: '26px',
    border: 'none',
    backgroundColor: isFocused ? '#ffffff' : '#e1e1e1',
    fontSize: '16px',
    fontWeight: 400,
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: isFocused
      ? '0 0 0 4px rgba(0, 132, 255, 0.2), 0 2px 12px rgba(0, 0, 0, 0.12)'
      : 'none',
    color: '#111111',
  }),
  searchIcon: {
    position: 'absolute' as const,
    left: '18px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    position: 'absolute' as const,
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  backdrop: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    animation: 'fadeIn 0.2s ease-out',
    cursor: 'default',
    border: 'none',
    padding: 0,
    margin: 0,
  },
};

const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideDown {
    from { 
      opacity: 0; 
      transform: translateY(-12px);
    }
    to { 
      opacity: 1; 
      transform: translateY(0);
    }
  }
`;

// ============ Helper Functions ============
const getSelectedQueryFromSuggestions = (
  focusedIndex: number,
  suggestions: { text: string }[],
  fallbackQuery: string
): string => {
  if (focusedIndex < suggestions.length) {
    return suggestions[focusedIndex]?.text ?? fallbackQuery;
  }
  return fallbackQuery;
};

const getItemFromCombinedList = (
  focusedIndex: number,
  recentSearches: string[],
  trending: { query: string }[]
): string | undefined => {
  const allItems = [...recentSearches, ...trending.map((t) => t.query)];
  return allItems[focusedIndex];
};

// ============ Custom Hook for Keyboard Navigation ============
interface UseKeyboardNavigationProps {
  totalItems: number;
  query: string;
  debouncedQuery: string;
  suggestions: { text: string }[];
  recentSearches: string[];
  trending: { query: string }[];
  focusedIndex: number;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
  executeSearch: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const useKeyboardNavigation = ({
  totalItems,
  query,
  debouncedQuery,
  suggestions,
  recentSearches,
  trending,
  focusedIndex,
  setFocusedIndex,
  setIsOpen,
  setIsFocused,
  executeSearch,
  inputRef,
}: UseKeyboardNavigationProps) => {
  const handleArrowDown = useCallback(() => {
    setIsOpen(true);
    setFocusedIndex((prev) => Math.min(prev + 1, totalItems - 1));
  }, [setIsOpen, setFocusedIndex, totalItems]);

  const handleArrowUp = useCallback(() => {
    setFocusedIndex((prev) => Math.max(prev - 1, -1));
  }, [setFocusedIndex]);

  const handleEnter = useCallback(() => {
    if (focusedIndex >= 0) {
      if (debouncedQuery) {
        const selectedQuery = getSelectedQueryFromSuggestions(
          focusedIndex,
          suggestions,
          query
        );
        executeSearch(selectedQuery);
      } else {
        const item = getItemFromCombinedList(focusedIndex, recentSearches, trending);
        if (item) {
          executeSearch(item);
        }
      }
    } else if (query.trim()) {
      executeSearch(query);
    }
  }, [
    focusedIndex,
    debouncedQuery,
    suggestions,
    recentSearches,
    trending,
    query,
    executeSearch,
  ]);

  const handleEscape = useCallback(() => {
    setIsOpen(false);
    setIsFocused(false);
    setFocusedIndex(-1);
    inputRef.current?.blur();
  }, [setIsOpen, setIsFocused, setFocusedIndex, inputRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          handleArrowDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleArrowUp();
          break;
        case 'Enter':
          e.preventDefault();
          handleEnter();
          break;
        case 'Escape':
          e.preventDefault();
          handleEscape();
          break;
      }
    },
    [handleArrowDown, handleArrowUp, handleEnter, handleEscape]
  );

  return handleKeyDown;
};

// ============ Main Component ============
export const HeaderSearch: React.FC = () => {
  const navigate = useNavigate();

  // Local state
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced query for API calls
  const debouncedQuery = useDebounce(query, 200);

  // Store - recent searches
  const addRecentSearch = useSearchPreferencesStore((s) => s.addRecentSearch);
  const removeRecentSearch = useSearchPreferencesStore((s) => s.removeRecentSearch);
  const clearRecentSearches = useSearchPreferencesStore((s) => s.clearRecentSearches);
  const recentSearches = useSearchPreferencesStore((s) => s.recentSearches);

  // API - suggestions (when typing)
  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useSuggestions(
    debouncedQuery,
    { enabled: debouncedQuery.length >= 2 }
  );

  // API - trending
  const { data: trendingData } = useTrending({
    limit: 8,
    enabled: true,
  });

  // API - categories for "Ideas for you"
  const { data: categoriesData } = useCategories({
    limit: 8,
    enabled: true,
  });

  // Memoized data
  const suggestions = useMemo(
    () => suggestionsData?.suggestions ?? [],
    [suggestionsData]
  );
  const trending = useMemo(() => trendingData ?? [], [trendingData]);
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

  // Calculate total navigable items
  const totalItems = useMemo(() => {
    if (debouncedQuery) {
      return suggestions.length + 1;
    }
    return recentSearches.length + trending.length;
  }, [debouncedQuery, suggestions.length, recentSearches.length, trending.length]);

  // ============ Handlers ============
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setFocusedIndex(-1);
      if (!isOpen) setIsOpen(true);
    },
    [isOpen]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
  }, []);

  const executeSearch = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      addRecentSearch(trimmed);
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);

      setQuery('');
      setIsOpen(false);
      setIsFocused(false);
      setFocusedIndex(-1);
      inputRef.current?.blur();
    },
    [navigate, addRecentSearch]
  );

  const handleSelect = useCallback(
    (selectedQuery: string) => {
      executeSearch(selectedQuery);
    },
    [executeSearch]
  );

  const handleRemoveRecent = useCallback(
    (queryToRemove: string) => {
      removeRecentSearch(queryToRemove);
    },
    [removeRecentSearch]
  );

  const handleClearAllRecent = useCallback(() => {
    clearRecentSearches();
  }, [clearRecentSearches]);

  const handleClear = useCallback(() => {
    setQuery('');
    setFocusedIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
    setIsFocused(false);
    setFocusedIndex(-1);
    inputRef.current?.blur();
  }, []);

  // Keyboard navigation hook
  const handleKeyDown = useKeyboardNavigation({
    totalItems,
    query,
    debouncedQuery,
    suggestions,
    recentSearches,
    trending,
    focusedIndex,
    setFocusedIndex,
    setIsOpen,
    setIsFocused,
    executeSearch,
    inputRef,
  });

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const showClearButton = query.length > 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <Layer zIndex={new FixedZIndex(Z_INDEX.DROPDOWN - 1)}>
          <button
            type="button"
            onClick={handleBackdropClick}
            aria-label="Close search dropdown"
            style={styles.backdrop}
          />
        </Layer>
      )}

      {/* Search Container */}
      <Box
        ref={containerRef}
        position="relative"
        width="100%"
        zIndex={isOpen ? new FixedZIndex(Z_INDEX.DROPDOWN) : undefined}
      >
        {/* Input Container */}
        <Box position="relative">
          {/* Search Icon */}
          <div style={styles.searchIcon}>
            <Icon
              accessibilityLabel=""
              icon="search"
              size={22}
              color={isFocused ? 'default' : 'subtle'}
            />
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            style={styles.input(isFocused)}
          />

          {/* Clear Button */}
          {showClearButton && (
            <div style={styles.clearButton}>
              <TapArea onTap={handleClear} rounding="circle" tapStyle="compress">
                <Box
                  width={36}
                  height={36}
                  rounding="circle"
                  color="secondary"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon accessibilityLabel="Clear" icon="cancel" size={18} color="dark" />
                </Box>
              </TapArea>
            </div>
          )}
        </Box>

        {/* Dropdown */}
        <SearchDropdown
          isOpen={isOpen}
          query={debouncedQuery}
          focusedIndex={focusedIndex}
          recentSearches={recentSearches}
          trending={trending}
          categories={categories}
          suggestions={suggestions}
          isLoadingSuggestions={isSuggestionsLoading}
          onSelect={handleSelect}
          onRemoveRecent={handleRemoveRecent}
          onClearAllRecent={handleClearAllRecent}
        />
      </Box>

      {/* Animation keyframes */}
      <style>{animationStyles}</style>
    </>
  );
};

export default HeaderSearch;