// src/shared/components/layout/HeaderSearch.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  SearchField, 
  Box, 
  Popover, 
  Flex, 
  TapArea, 
  Text, 
  Icon,
} from 'gestalt';
import { useSearchHistoryStore } from '../../stores/searchHistoryStore';
import { useDebounce } from '../../hooks/useDebounce';

export const HeaderSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  
  // Search history store
  const history = useSearchHistoryStore((state) => state.history);
  const addSearch = useSearchHistoryStore((state) => state.addSearch);
  const removeSearch = useSearchHistoryStore((state) => state.removeSearch);
  const clearHistory = useSearchHistoryStore((state) => state.clearHistory);
  
  const debouncedQuery = useDebounce(query, 300);

  // Callback ref для anchor element
  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setAnchorElement(node);
    }
  }, []);

  const handleChange = useCallback(({ value }: { value: string }) => {
    setQuery(value);
    if (value.length > 0) {
      setIsOpen(true);
    }
  }, []);

  const handleSubmit = useCallback((searchQuery?: string) => {
    const finalQuery = (searchQuery ?? query).trim();
    if (finalQuery) {
      addSearch(finalQuery);
      navigate(`/search?q=${encodeURIComponent(finalQuery)}`);
      setIsOpen(false);
    }
  }, [query, navigate, addSearch]);

  const handleKeyDown = useCallback(
    ({ event }: { event: React.KeyboardEvent<HTMLInputElement> }) => {
      if (event.key === 'Enter') {
        handleSubmit();
      } else if (event.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [handleSubmit]
  );

  const handleFocus = useCallback(() => {
    if (history.length > 0 || query.length > 0) {
      setIsOpen(true);
    }
  }, [history.length, query.length]);

  const handleHistoryItemClick = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    handleSubmit(searchQuery);
  }, [handleSubmit]);

  const handleRemoveHistoryItem = useCallback((searchQuery: string) => {
    removeSearch(searchQuery);
  }, [removeSearch]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setIsOpen(false);
  }, [clearHistory]);

  const recentSearches = history.slice(0, 5);
  const showDropdown = isOpen && (recentSearches.length > 0 || debouncedQuery.length > 0);

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
          <Box padding={2} minWidth={300}>
            {/* Recent Searches */}
            {recentSearches.length > 0 && !debouncedQuery && (
              <>
                <Box paddingX={2} paddingY={1}>
                  <Flex justifyContent="between" alignItems="center">
                    <Text size="100" color="subtle" weight="bold">
                      Recent searches
                    </Text>
                    <TapArea onTap={handleClearHistory}>
                      <Text size="100" color="subtle">
                        Clear all
                      </Text>
                    </TapArea>
                  </Flex>
                </Box>
                
                {recentSearches.map((item) => (
                  <TapArea 
                    key={item.query} 
                    onTap={() => handleHistoryItemClick(item.query)}
                    rounding={2}
                  >
                    <Box 
                      padding={2} 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="between"
                    >
                      <Flex alignItems="center" gap={2}>
                        <Icon 
                          accessibilityLabel="" 
                          icon="clock" 
                          size={16} 
                          color="subtle" 
                        />
                        <Text size="200">{item.query}</Text>
                      </Flex>
                      <TapArea 
                        onTap={() => handleRemoveHistoryItem(item.query)}
                        tapStyle="compress"
                      >
                        <Icon 
                          accessibilityLabel="Remove" 
                          icon="cancel" 
                          size={12} 
                          color="subtle" 
                        />
                      </TapArea>
                    </Box>
                  </TapArea>
                ))}
              </>
            )}
            
            {/* Search suggestion when typing */}
            {debouncedQuery && (
              <TapArea onTap={() => handleSubmit()} rounding={2}>
                <Box padding={2} display="flex" alignItems="center">
                  <Flex alignItems="center" gap={2}>
                    <Icon 
                      accessibilityLabel="" 
                      icon="search" 
                      size={16} 
                      color="default" 
                    />
                    <Text size="200">
                      Search for "<Text weight="bold" inline>{debouncedQuery}</Text>"
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