// src/pages/SearchPage.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Text, 
  Tabs, 
  Divider, 
  Flex, 
  Button, 
  SearchField,
  Spinner,
} from 'gestalt';
import { 
  useSearchPins,
  useSearchUsers,
  useSearchBoards,
  useUniversalSearch,
  useSearchHistory,
  useClearSearchHistory,
  SearchFilters,
  SearchResultsHeader,
  SearchAggregations,
  SearchPinGrid,
  SearchUserCard,
  SearchBoardCard,
  UniversalSearchResults,
  useSearchPreferencesStore,
} from '@/modules/search';
import type { SearchSortBy } from '@/modules/search';
import { TagChip } from '@/modules/tag';
import { EmptyState, LoadingSpinner, ErrorMessage } from '@/shared/components';
import { useAuth } from '@/modules/auth';
import { parseSearchUrl } from '@/modules/search';

type SearchTab = 'all' | 'pins' | 'users' | 'boards';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Parse URL params
  const urlParams = useMemo(() => parseSearchUrl(searchParams), [searchParams]);
  
  // Local state
  const [localQuery, setLocalQuery] = useState(urlParams.query);
  const [activeTab, setActiveTab] = useState<SearchTab>(urlParams.type || 'all');
  const [selectedTags, setSelectedTags] = useState<string[]>(urlParams.tags || []);
  const [sortBy, setSortBy] = useState<SearchSortBy>(urlParams.sortBy || 'RELEVANCE');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [fuzzy, setFuzzy] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Store
  const addRecentSearch = useSearchPreferencesStore((s) => s.addRecentSearch);
  const recentSearches = useSearchPreferencesStore((s) => s.recentSearches);
  
  // Server-side history
  const { data: serverHistory } = useSearchHistory({ enabled: isAuthenticated && !urlParams.query });
  const clearHistoryMutation = useClearSearchHistory();
  
  // Sync URL → state when URL changes
  useEffect(() => {
    const params = parseSearchUrl(searchParams);
    if (params.query !== localQuery) {
      setLocalQuery(params.query);
    }
    if (params.type && params.type !== activeTab) {
      setActiveTab(params.type);
    }
    if (params.tags) {
      setSelectedTags(params.tags);
    }
    if (params.sortBy) {
      setSortBy(params.sortBy);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Universal search (for "all" tab)
  const {
    data: universalData,
    isLoading: isUniversalLoading,
  } = useUniversalSearch(urlParams.query, {
    enabled: !!urlParams.query && activeTab === 'all',
  });

  // Pins search
  const {
    pins,
    totalHits: pinsTotalHits,
    took: pinsTook,
    aggregations: pinsAggregations,
    isLoading: isPinsLoading,
    isFetchingNextPage: isPinsFetchingNext,
    hasNextPage: pinsHasNext,
    fetchNextPage: pinsFetchNext,
    isError: isPinsError,
    refetch: pinsRefetch,
  } = useSearchPins({
    q: urlParams.query,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    sortBy,
    createdFrom: dateFrom?.toISOString(),
    createdTo: dateTo?.toISOString(),
    fuzzy,
    enabled: !!urlParams.query && activeTab === 'pins',
  });

  // Users search
  const {
    users,
    totalHits: usersTotalHits,
    took: usersTook,
    isLoading: isUsersLoading,
    isFetchingNextPage: isUsersFetchingNext,
    hasNextPage: usersHasNext,
    fetchNextPage: usersFetchNext,
    isError: isUsersError,
    refetch: usersRefetch,
  } = useSearchUsers({
    q: urlParams.query,
    sortBy,
    fuzzy,
    enabled: !!urlParams.query && activeTab === 'users',
  });

  // Boards search
  const {
    boards,
    totalHits: boardsTotalHits,
    took: boardsTook,
    isLoading: isBoardsLoading,
    isFetchingNextPage: isBoardsFetchingNext,
    hasNextPage: boardsHasNext,
    fetchNextPage: boardsFetchNext,
    isError: isBoardsError,
    refetch: boardsRefetch,
  } = useSearchBoards({
    q: urlParams.query,
    sortBy,
    fuzzy,
    enabled: !!urlParams.query && activeTab === 'boards',
  });

  // Handlers
  const handleSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      addRecentSearch(trimmed);
      setSearchParams({ q: trimmed }, { replace: true });
    }
  }, [setSearchParams, addRecentSearch]);

  const handleSearchChange = useCallback(({ value }: { value: string }) => {
    setLocalQuery(value);
  }, []);

  const handleSearchKeyDown = useCallback(({ event }: { event: React.KeyboardEvent<HTMLInputElement> }) => {
    if (event.key === 'Enter') {
      handleSearch(localQuery);
    }
  }, [localQuery, handleSearch]);

  const handleTabChange = useCallback(({ activeTabIndex }: { activeTabIndex: number }) => {
    const tabs: SearchTab[] = ['all', 'pins', 'users', 'boards'];
    const newTab = tabs[activeTabIndex] || 'all';
    setActiveTab(newTab);
    
    // Update URL
    const params = new URLSearchParams(searchParams);
    if (newTab === 'all') {
      params.delete('type');
    } else {
      params.set('type', newTab);
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const getTabIndex = useCallback((): number => {
    const tabs: SearchTab[] = ['all', 'pins', 'users', 'boards'];
    return tabs.indexOf(activeTab);
  }, [activeTab]);

  const handleClearFilters = useCallback(() => {
    setSelectedTags([]);
    setSortBy('RELEVANCE');
    setDateFrom(null);
    setDateTo(null);
    setFuzzy(true);
  }, []);

  const handleHistoryClick = useCallback((query: string) => {
    setLocalQuery(query);
    handleSearch(query);
  }, [handleSearch]);

  const handleClearHistory = useCallback(() => {
    clearHistoryMutation.mutate();
  }, [clearHistoryMutation]);

  const handleTagFromAggregations = useCallback((tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
      setActiveTab('pins'); // Switch to pins to show filtered results
    }
  }, [selectedTags]);

  const hasFilters = selectedTags.length > 0 || dateFrom || dateTo || sortBy !== 'RELEVANCE';

  // Combine histories
  const history = useMemo(() => {
    if (isAuthenticated && serverHistory) {
      return serverHistory.map(h => h.query);
    }
    return recentSearches;
  }, [isAuthenticated, serverHistory, recentSearches]);

  // Empty state - no query
  if (!urlParams.query) {
    return (
      <Box paddingY={4}>
        <Box marginBottom={6}>
          <Heading size="400" accessibilityLevel={1}>
            Search
          </Heading>
        </Box>

        {/* Search Bar */}
        <Box maxWidth={600} marginBottom={6}>
          <SearchField
            id="search-main"
            accessibilityLabel="Search"
            accessibilityClearButtonLabel="Clear"
            placeholder="Search for pins, users, or boards..."
            value={localQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
        </Box>

        {/* Recent Searches */}
        {history.length > 0 && (
          <Box>
            <Box marginBottom={3}>
              <Flex justifyContent="between" alignItems="center">
                <Text weight="bold" size="300">Recent Searches</Text>
                <Button
                  text="Clear all"
                  onClick={handleClearHistory}
                  size="sm"
                  color="gray"
                />
              </Flex>
            </Box>
            <Flex wrap gap={2}>
              {history.slice(0, 10).map((query) => (
                <TagChip
                  key={query}
                  tag={query}
                  size="md"
                  onClick={() => handleHistoryClick(query)}
                />
              ))}
            </Flex>
          </Box>
        )}

        {history.length === 0 && (
          <EmptyState
            title="Search for something"
            description="Enter a search term to find pins, users, or boards"
            icon="search"
          />
        )}
      </Box>
    );
  }

  return (
    <Box paddingY={4}>
      {/* Header */}
      <Box marginBottom={4}>
        <Heading size="400" accessibilityLevel={1}>
          Search results for &quot;{urlParams.query}&quot;
        </Heading>
      </Box>

      {/* Search Bar */}
      <Flex gap={3} marginBottom={4} wrap>
        <Box flex="grow" maxWidth={600}>
          <SearchField
            id="search-results"
            accessibilityLabel="Search"
            accessibilityClearButtonLabel="Clear"
            placeholder="Search..."
            value={localQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
        </Box>
        
        <Button
          text={showFilters ? 'Hide Filters' : 'Filters'}
          onClick={() => setShowFilters(!showFilters)}
          color={hasFilters ? 'red' : 'gray'}
          size="lg"
          iconEnd="filter"
        />
      </Flex>

      {/* Filters */}
      {showFilters && (
        <Box marginBottom={4}>
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

      {/* Tabs */}
      <Box marginBottom={4}>
        <Tabs
          activeTabIndex={getTabIndex()}
          onChange={handleTabChange}
          tabs={[
            { href: '#all', text: 'All' },
            { href: '#pins', text: `Pins${pinsTotalHits ? ` (${pinsTotalHits})` : ''}` },
            { href: '#users', text: `Users${usersTotalHits ? ` (${usersTotalHits})` : ''}` },
            { href: '#boards', text: `Boards${boardsTotalHits ? ` (${boardsTotalHits})` : ''}` },
          ]}
        />
      </Box>

      <Divider />

      {/* Tab Content */}
      <Box marginTop={4}>
        {/* All Tab - Universal Search */}
        {activeTab === 'all' && (
          <UniversalSearchResults
            data={universalData}
            isLoading={isUniversalLoading}
            query={urlParams.query}
          />
        )}

        {/* Pins Tab */}
        {activeTab === 'pins' && (
          <Box>
            <SearchResultsHeader
              query={urlParams.query}
              totalHits={pinsTotalHits}
              took={pinsTook}
              type="pins"
              isLoading={isPinsLoading}
            />
            
            {pinsAggregations && (
              <Box marginBottom={4}>
                <SearchAggregations
                  aggregations={pinsAggregations}
                  onTagClick={handleTagFromAggregations}
                />
              </Box>
            )}
            
            {isPinsError ? (
              <ErrorMessage
                title="Failed to search pins"
                message="Please try again"
                onRetry={() => pinsRefetch()}
              />
            ) : (
              <SearchPinGrid
                pins={pins}
                isLoading={isPinsLoading}
                isFetchingNextPage={isPinsFetchingNext}
                hasNextPage={pinsHasNext}
                fetchNextPage={pinsFetchNext}
                emptyMessage={`No pins found for "${urlParams.query}"`}
              />
            )}
          </Box>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Box>
            <SearchResultsHeader
              query={urlParams.query}
              totalHits={usersTotalHits}
              took={usersTook}
              type="users"
              isLoading={isUsersLoading}
            />
            
            {isUsersError ? (
              <ErrorMessage
                title="Failed to search users"
                message="Please try again"
                onRetry={() => usersRefetch()}
              />
            ) : isUsersLoading ? (
              <LoadingSpinner size="lg" />
            ) : users.length === 0 ? (
              <EmptyState
                title="No users found"
                description={`No users matching "${urlParams.query}"`}
                icon="person"
              />
            ) : (
              <Box>
                <Flex direction="column" gap={2}>
                  {users.map((user) => (
                    <SearchUserCard key={user.id} user={user} />
                  ))}
                </Flex>
                
                {isUsersFetchingNext && (
                  <Box display="flex" justifyContent="center" padding={4}>
                    <Spinner accessibilityLabel="Loading more users" show />
                  </Box>
                )}
                
                {usersHasNext && !isUsersFetchingNext && (
                  <Box display="flex" justifyContent="center" padding={4}>
                    <Button
                      text="Load more"
                      onClick={() => usersFetchNext()}
                      size="lg"
                      color="gray"
                    />
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Boards Tab */}
        {activeTab === 'boards' && (
          <Box>
            <SearchResultsHeader
              query={urlParams.query}
              totalHits={boardsTotalHits}
              took={boardsTook}
              type="boards"
              isLoading={isBoardsLoading}
            />
            
            {isBoardsError ? (
              <ErrorMessage
                title="Failed to search boards"
                message="Please try again"
                onRetry={() => boardsRefetch()}
              />
            ) : isBoardsLoading ? (
              <LoadingSpinner size="lg" />
            ) : boards.length === 0 ? (
              <EmptyState
                title="No boards found"
                description={`No boards matching "${urlParams.query}"`}
                icon="board"
              />
            ) : (
              <Box>
                <Flex gap={4} wrap>
                  {boards.map((board) => (
                    <Box key={board.id} width={236}>
                      <SearchBoardCard board={board} />
                    </Box>
                  ))}
                </Flex>
                
                {isBoardsFetchingNext && (
                  <Box display="flex" justifyContent="center" padding={4}>
                    <Spinner accessibilityLabel="Loading more boards" show />
                  </Box>
                )}
                
                {boardsHasNext && !isBoardsFetchingNext && (
                  <Box display="flex" justifyContent="center" padding={4}>
                    <Button
                      text="Load more"
                      onClick={() => boardsFetchNext()}
                      size="lg"
                      color="gray"
                    />
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SearchPage;