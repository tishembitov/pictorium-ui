// src/shared/components/layout/HeaderSearch.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SearchField, 
  Box, 
  Popover, 
  Flex, 
  TapArea, 
  Text, 
  Icon,
  Spinner,
} from 'gestalt';
import { 
  useSuggestions, 
  useTrending,
  SuggestionDropdown,
  useSearchPreferencesStore,
} from '@/modules/search';
import { useSearchHistory } from '@/modules/search';
import { useAuth } from '@/modules/auth';
import { useDebounce } from '@/shared/hooks/useDebounce';

export const HeaderSearch: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedQuery = useDebounce(query, 200);
  
  // Search preferences store (local)
  const addRecentSearch = useSearchPreferencesStore((s) => s.addRecentSearch);
  const recentSearches = useSearchPreferencesStore((s) => s.recentSearches);
  const clearRecentSearches = useSearchPreferencesStore((s) => s.clearRecentSearches);
  
  // API-based suggestions
  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useSuggestions(
    debouncedQuery,
    { enabled: debouncedQuery.length >= 2 }
  );
  
  // Trending queries
  const { data: trendingData } = useTrending({ 
    limit: 5,
    enabled: !debouncedQuery && isOpen,
  });
  
  // Server-side search history (for authenticated users)
  const { data: serverHistory } = useSearchHistory({
    limit: 5,
    enabled: isAuthenticated && !debouncedQuery && isOpen,
  });

  const suggestions = suggestionsData?.suggestions ?? [];
  const trending = trendingData ?? [];
  
  // Combine local and server history
  const history = isAuthenticated 
    ? (serverHistory ?? []).map(h => ({ query: h.query, timestamp: Date.now() }))
    : recentSearches.map(q => ({ query: q, timestamp: Date.now() }));

  // Callback ref for anchor element
  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setAnchorElement(node);
    }
  }, []);

  const handleChange = useCallback(({ value }: { value: string }) => {
    setQuery(value);
    setFocusedIndex(-1);
    if (value.length > 0 || history.length > 0 || trending.length > 0) {
      setIsOpen(true);
    }
  }, [history.length, trending.length]);

  const handleSubmit = useCallback((searchQuery?: string) => {
    const finalQuery = (searchQuery ?? query).trim();
    if (finalQuery) {
      addRecentSearch(finalQuery);
      navigate(`/search?q=${encodeURIComponent(finalQuery)}`);
      setIsOpen(false);
      setQuery('');
    }
  }, [query, navigate, addRecentSearch]);

  const handleKeyDown = useCallback(
    ({ event }: { event: React.KeyboardEvent<HTMLInputElement> }) => {
      const totalItems = suggestions.length + (query ? 1 : 0); // +1 for "Search for" option
      
      if (event.key === 'Enter') {
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          handleSubmit(suggestions[focusedIndex]?.text);
        } else {
          handleSubmit();
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex((prev) => Math.min(prev + 1, totalItems - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
      } else if (event.key === 'Escape') {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    },
    [focusedIndex, suggestions, handleSubmit, query]
  );

  const handleFocus = useCallback(() => {
    if (query.length > 0 || history.length > 0 || trending.length > 0) {
      setIsOpen(true);
    }
  }, [query.length, history.length, trending.length]);

  const handleSuggestionClick = useCallback((text: string) => {
    handleSubmit(text);
  }, [handleSubmit]);

  const handleHistoryClick = useCallback((text: string) => {
    setQuery(text);
    handleSubmit(text);
  }, [handleSubmit]);

  const handleTrendingClick = useCallback((text: string) => {
    setQuery(text);
    handleSubmit(text);
  }, [handleSubmit]);

  const handleClearHistory = useCallback(() => {
    clearRecentSearches();
  }, [clearRecentSearches]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        anchorElement && 
        !anchorElement.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, anchorElement]);

  const showDropdown = isOpen && (
    suggestions.length > 0 || 
    (!debouncedQuery && (history.length > 0 || trending.length > 0)) ||
    isSuggestionsLoading ||
    debouncedQuery.length > 0
  );

  return (
    <Box width="100%" ref={setAnchorRef}>
      <SearchField
        id="header-search"
        accessibilityLabel="Search pins"
        accessibilityClearButtonLabel="Clear search"
        placeholder="Search for ideas..."
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        ref={inputRef}
      />
      
      {showDropdown && anchorElement && (
        <Popover
          anchor={anchorElement}
          onDismiss={() => setIsOpen(false)}
          idealDirection="down"
          positionRelativeToAnchor={false}
          size="flexible"
          color="white"
        >
          <Box padding={2} minWidth={350} maxWidth={500}>
            {/* Loading state */}
            {isSuggestionsLoading && debouncedQuery.length >= 2 && (
              <Box padding={3} display="flex" justifyContent="center">
                <Spinner accessibilityLabel="Loading suggestions" show size="sm" />
              </Box>
            )}
            
            {/* Suggestions dropdown */}
            {!isSuggestionsLoading && (
              <SuggestionDropdown
                suggestions={suggestions}
                trending={trending}
                history={history}
                onSuggestionClick={handleSuggestionClick}
                onHistoryClick={handleHistoryClick}
                onTrendingClick={handleTrendingClick}
                onClearHistory={handleClearHistory}
                focusedIndex={focusedIndex}
                showTrending={!debouncedQuery}
                showHistory={!debouncedQuery}
              />
            )}
            
            {/* Search for query option */}
            {debouncedQuery && !isSuggestionsLoading && (
              <TapArea onTap={() => handleSubmit()} rounding={2}>
                <Box 
                  padding={2} 
                  rounding={2}
                  color={focusedIndex === suggestions.length ? 'secondary' : 'transparent'}
                >
                  <Flex alignItems="center" gap={2}>
                    <Icon accessibilityLabel="" icon="search" size={16} color="default" />
                    <Text size="200">
                      Search for &quot;<Text weight="bold" inline>{debouncedQuery}</Text>&quot;
                    </Text>
                  </Flex>
                </Box>
              </TapArea>
            )}
          </Box>
        </Popover>
      )}
    </Box>
  );
};

export default HeaderSearch;