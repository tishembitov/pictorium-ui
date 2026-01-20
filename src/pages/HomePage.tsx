// src/pages/HomePage.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Flex, 
  IconButton, 
  Tooltip, 
  Text, 
  Button,
  SearchField,
} from 'gestalt';
import { 
  PinGrid, 
  usePins,
} from '@/modules/pin';
import { 
  useSearchPins,
  SearchSortSelect,
  SearchFilters,
  SearchResultsHeader,
  SearchAggregations,
  useTrending,
} from '@/modules/search';
import type { SearchSortBy } from '@/modules/search';
import { TagInput, CategoryGrid, TagChip } from '@/modules/tag';
import { useAuth } from '@/modules/auth';
import { EmptyState } from '@/shared/components';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { ROUTES } from '@/app/router/routes';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  
  // Local filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SearchSortBy>('RELEVANCE');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [fuzzy, setFuzzy] = useState(true);
  
  // Debounced search
  const debouncedSearch = useDebounce(searchInput, 300);
  
  // Check if we're in search mode
  const isSearchMode = !!(debouncedSearch || selectedTags.length > 0);
  
  // Trending queries for non-search state
  const { data: trending } = useTrending({ 
    limit: 8, 
    enabled: !isSearchMode 
  });

  // Use search API when filtering
  const {
    pins: searchPins,
    totalHits,
    took,
    aggregations,
    isLoading: isSearchLoading,
    isFetchingNextPage: isSearchFetchingNext,
    hasNextPage: searchHasNext,
    fetchNextPage: searchFetchNext,
    isError: isSearchError,
    refetch: searchRefetch,
  } = useSearchPins({
    q: debouncedSearch || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    sortBy,
    createdFrom: dateFrom?.toISOString(),
    createdTo: dateTo?.toISOString(),
    fuzzy,
    enabled: isSearchMode,
  });

  // Use regular pins API for home feed
  const {
    pins: feedPins,
    isLoading: isFeedLoading,
    isFetchingNextPage: isFeedFetchingNext,
    hasNextPage: feedHasNext,
    fetchNextPage: feedFetchNext,
    isError: isFeedError,
    refetch: feedRefetch,
  } = usePins({}, { 
    enabled: !isSearchMode,
  });

  // Select which data to show
  const pins = isSearchMode ? searchPins : feedPins;
  const isLoading = isSearchMode ? isSearchLoading : isFeedLoading;
  const isFetchingNextPage = isSearchMode ? isSearchFetchingNext : isFeedFetchingNext;
  const hasNextPage = isSearchMode ? searchHasNext : feedHasNext;
  const fetchNextPage = isSearchMode ? searchFetchNext : feedFetchNext;
  const isError = isSearchMode ? isSearchError : isFeedError;
  const refetch = isSearchMode ? searchRefetch : feedRefetch;

  const hasFilters = selectedTags.length > 0 || dateFrom || dateTo || sortBy !== 'RELEVANCE';

  // Handlers
  const handleCreatePin = useCallback(() => {
    navigate(ROUTES.PIN_CREATE);
  }, [navigate]);

  const handleExplore = useCallback(() => {
    navigate(ROUTES.EXPLORE);
  }, [navigate]);

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    setSelectedTags([]);
    setSortBy('RELEVANCE');
    setDateFrom(null);
    setDateTo(null);
  }, []);

  const handleSearchChange = useCallback(({ value }: { value: string }) => {
    setSearchInput(value);
  }, []);

  const handleSearchKeyDown = useCallback(({ event }: { event: React.KeyboardEvent<HTMLInputElement> }) => {
    if (event.key === 'Enter' && searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  }, [searchInput, navigate]);

  const handleTrendingClick = useCallback((query: string) => {
    setSearchInput(query);
  }, []);

  const handleTagFromAggregations = useCallback((tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  }, [selectedTags]);

  return (
    <Box paddingY={4}>
      {/* Header Section */}
      <Flex 
        direction={isMobile ? 'column' : 'row'} 
        justifyContent="between" 
        alignItems={isMobile ? 'start' : 'center'}
        gap={3}
      >
        <Box>
          <Heading size="400" accessibilityLevel={1}>
            {isAuthenticated ? 'Home Feed' : 'Discover Ideas'}
          </Heading>
          {isSearchMode && totalHits > 0 && (
            <Box marginTop={1}>
              <Text size="200" color="subtle">
                {totalHits.toLocaleString()} pins found
              </Text>
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        <Flex gap={3} alignItems="center" wrap>
          {/* Search Bar */}
          <Box width={isMobile ? '100%' : 280}>
            <SearchField
              id="home-search"
              accessibilityLabel="Search pins"
              accessibilityClearButtonLabel="Clear"
              placeholder="Search pins..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
          </Box>

          {/* Filter Toggle */}
          <Tooltip text={showFilters ? 'Hide filters' : 'Show filters'}>
            <IconButton
              accessibilityLabel="Toggle filters"
              icon="filter"
              onClick={toggleFilters}
              size="md"
              bgColor={hasFilters ? 'red' : 'gray'}
              iconColor={hasFilters ? 'white' : 'darkGray'}
            />
          </Tooltip>

          {/* Create Pin */}
          {isAuthenticated && (
            <Button
              text="Create"
              onClick={handleCreatePin}
              color="red"
              size="lg"
              iconEnd="add"
            />
          )}
        </Flex>
      </Flex>

      {/* Trending (when not searching) */}
      {!isSearchMode && trending && trending.length > 0 && (
        <Box marginTop={4}>
          <Flex gap={2} alignItems="center" wrap>
            <Text size="200" color="subtle" weight="bold">
              Trending:
            </Text>
            {trending.slice(0, 6).map((item) => (
              <TagChip
                key={item.query}
                tag={item.query}
                size="sm"
                onClick={() => handleTrendingClick(item.query)}
              />
            ))}
          </Flex>
        </Box>
      )}

      {/* Filters Section */}
      {showFilters && (
        <Box marginTop={4}>
          <SearchFilters
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            sortBy={sortBy}
            onSortChange={setSortBy}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            fuzzy={fuzzy}
            onFuzzyChange={setFuzzy}
            onClear={handleClearFilters}
          />
        </Box>
      )}

      {/* Search Results Header */}
      {isSearchMode && debouncedSearch && (
        <Box marginTop={4}>
          <SearchResultsHeader
            query={debouncedSearch}
            totalHits={totalHits}
            took={took}
            type="pins"
            isLoading={isLoading}
          />
        </Box>
      )}

      {/* Aggregations (when searching) */}
      {isSearchMode && aggregations && (
        <Box marginTop={4}>
          <SearchAggregations
            aggregations={aggregations}
            onTagClick={handleTagFromAggregations}
            compact
          />
        </Box>
      )}

      {/* Categories for Non-Authenticated Users */}
      {!isAuthenticated && !isSearchMode && pins.length === 0 && !isLoading && (
        <Box marginTop={6} marginBottom={6}>
          <CategoryGrid 
            limit={8} 
            size="md" 
            title="Popular Categories"
            showTitle
          />
        </Box>
      )}

      {/* Error State */}
      {isError && (
        <Box marginTop={6}>
          <EmptyState
            title="Something went wrong"
            description="We couldn't load the pins. Please try again."
            icon="workflow-status-problem"
            action={{
              text: 'Try again',
              onClick: handleRetry,
            }}
          />
        </Box>
      )}

      {/* Pins Grid */}
      <Box marginTop={4}>
        <PinGrid
          pins={pins}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={handleFetchNextPage}
          showHighlights={isSearchMode}
          emptyMessage={
            isSearchMode
              ? 'No pins match your search'
              : 'No pins to show yet'
          }
          emptyAction={
            isSearchMode
              ? { text: 'Clear filters', onClick: handleClearFilters }
              : { text: 'Explore', onClick: handleExplore }
          }
        />
      </Box>
    </Box>
  );
};

export default HomePage;