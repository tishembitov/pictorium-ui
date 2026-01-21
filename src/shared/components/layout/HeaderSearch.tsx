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

// Animation keyframes as a style tag
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

// ============ Styles ============
const searchStyles = {
  wrapper: {
    position: 'relative' as const,
    width: '100%',
  },
  inputContainer: {
    position: 'relative' as const,
    width: '100%',
  },
  input: {
    width: '100%',
    height: '48px',
    padding: '0 48px',
    borderRadius: '24px',
    border: 'none',
    backgroundColor: '#f0f0f0',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  inputFocused: {
    backgroundColor: '#ffffff',
    boxShadow: '0 0 0 3px rgba(0, 132, 255, 0.5)',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none' as const,
    color: '#767676',
  },
  clearButton: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  backdrop: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    animation: 'fadeIn 0.15s ease-out',
    cursor: 'pointer',
    // Reset button styles
    border: 'none',
    padding: 0,
    margin: 0,
  },
};

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
  
  // API - trending (when not typing)
  const { data: trendingData } = useTrending({ 
    limit: 6,
    enabled: isOpen && !debouncedQuery,
  });
  
  // API - categories (when not typing)
  const { data: categoriesData } = useCategories({
    limit: 8,
    enabled: isOpen && !debouncedQuery,
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
      return suggestions.length + 1; // suggestions + "search for" option
    }
    return recentSearches.length;
  }, [debouncedQuery, suggestions.length, recentSearches.length]);

  // ============ Handlers ============
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setFocusedIndex(-1);
    if (!isOpen) setIsOpen(true);
  }, [isOpen]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay closing to allow click events on dropdown
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }, 150);
  }, []);

  const executeSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    
    // Add to recent searches
    addRecentSearch(trimmed);
    
    // Navigate to search page
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    
    // Reset state
    setQuery('');
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.blur();
  }, [navigate, addRecentSearch]);

  const handleSelect = useCallback((selectedQuery: string) => {
    executeSearch(selectedQuery);
  }, [executeSearch]);

  const handleRemoveRecent = useCallback((queryToRemove: string) => {
    removeRecentSearch(queryToRemove);
  }, [removeRecentSearch]);

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
    setFocusedIndex(-1);
    inputRef.current?.blur();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex((prev) => Math.min(prev + 1, totalItems - 1));
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
        break;
        
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0) {
          // Select focused item
          if (debouncedQuery) {
            if (focusedIndex < suggestions.length) {
              executeSearch(suggestions[focusedIndex]?.text ?? query);
            } else {
              executeSearch(query);
            }
          } else if (focusedIndex < recentSearches.length) {
            executeSearch(recentSearches[focusedIndex] ?? '');
          }
        } else if (query.trim()) {
          executeSearch(query);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [focusedIndex, totalItems, query, debouncedQuery, suggestions, recentSearches, executeSearch]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
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
            style={searchStyles.backdrop}
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
          <Box
            position="absolute"
            dangerouslySetInlineStyle={{
              __style: {
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              },
            }}
          >
            <Icon accessibilityLabel="" icon="search" size={20} color="subtle" />
          </Box>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for ideas..."
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            style={{
              ...searchStyles.input,
              ...(isFocused ? searchStyles.inputFocused : {}),
            }}
          />

          {/* Clear Button */}
          {showClearButton && (
            <Box
              position="absolute"
              dangerouslySetInlineStyle={{
                __style: {
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                },
              }}
            >
              <TapArea onTap={handleClear} rounding="circle" tapStyle="compress">
                <Box
                  width={28}
                  height={28}
                  rounding="circle"
                  color="secondary"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon accessibilityLabel="Clear" icon="cancel" size={14} color="dark" />
                </Box>
              </TapArea>
            </Box>
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