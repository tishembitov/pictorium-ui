// src/pages/SearchPage.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Text, 
  Tabs, 
  Divider, 
  Flex, 
  Button,
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
  parseSearchUrl,
} from '@/modules/search';
import type { 
  SearchSortBy,
  PinSearchResult,
  UserSearchResult,
  BoardSearchResult,
  Aggregations,
} from '@/modules/search';
import { TagChip, CategoryGrid } from '@/modules/tag';
import { EmptyState, LoadingSpinner, ErrorMessage } from '@/shared/components';
import { useAuth } from '@/modules/auth';

type SearchTab = 'all' | 'pins' | 'users' | 'boards';

/**
 * SearchPage - Full search experience with tabs and filters
 * Navigated to from HeaderSearch or direct URL
 */
const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  // Parse URL params
  const urlParams = useMemo(() => parseSearchUrl(searchParams), [searchParams]);
  
  // Local state
  const [activeTab, setActiveTab] = useState<SearchTab>(urlParams.type || 'all');
  const [selectedTags, setSelectedTags] = useState<string[]>(urlParams.tags || []);
  const [sortBy, setSortBy] = useState<SearchSortBy>(urlParams.sortBy || 'RELEVANCE');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [fuzzy, setFuzzy] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Store
  const recentSearches = useSearchPreferencesStore((s) => s.recentSearches);
  
  // Server-side history
  const { data: serverHistory } = useSearchHistory({ enabled: isAuthenticated && !urlParams.query });
  const clearHistoryMutation = useClearSearchHistory();

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
    setSearchParams({ q: query }, { replace: true });
  }, [setSearchParams]);

  const handleClearHistory = useCallback(() => {
    clearHistoryMutation.mutate();
  }, [clearHistoryMutation]);

  const handleTagFromAggregations = useCallback((tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
      setActiveTab('pins');
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

  // Tab labels with counts
  const pinsTabLabel = pinsTotalHits ? `Pins (${pinsTotalHits.toLocaleString()})` : 'Pins';
  const usersTabLabel = usersTotalHits ? `Users (${usersTotalHits.toLocaleString()})` : 'Users';
  const boardsTabLabel = boardsTotalHits ? `Boards (${boardsTotalHits.toLocaleString()})` : 'Boards';

  // Empty state - no query
  if (!urlParams.query) {
    return (
      <SearchEmptyState
        history={history}
        onHistoryClick={handleHistoryClick}
        onClearHistory={handleClearHistory}
      />
    );
  }

  return (
    <Box paddingY={4}>
      {/* Filters Toggle */}
      <Box marginBottom={4}>
        <Flex gap={3} alignItems="center">
          <Button
            text={showFilters ? 'Hide Filters' : 'Filters'}
            onClick={() => setShowFilters(!showFilters)}
            color={hasFilters ? 'red' : 'gray'}
            size="lg"
            iconEnd="filter"
          />
          
          {hasFilters && (
            <Button
              text="Clear all"
              onClick={handleClearFilters}
              color="gray"
              size="sm"
            />
          )}
        </Flex>
      </Box>

      {/* Filters Panel */}
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
            { href: '#pins', text: pinsTabLabel },
            { href: '#users', text: usersTabLabel },
            { href: '#boards', text: boardsTabLabel },
          ]}
        />
      </Box>

      <Divider />

      {/* Tab Content */}
      <Box marginTop={4}>
        {activeTab === 'all' && (
          <UniversalSearchResults
            data={universalData}
            isLoading={isUniversalLoading}
            query={urlParams.query}
          />
        )}

        {activeTab === 'pins' && (
          <PinsTabContent
            query={urlParams.query}
            pins={pins}
            totalHits={pinsTotalHits}
            took={pinsTook}
            aggregations={pinsAggregations}
            isLoading={isPinsLoading}
            isFetchingNextPage={isPinsFetchingNext}
            hasNextPage={pinsHasNext}
            isError={isPinsError}
            onFetchNextPage={pinsFetchNext}
            onRefetch={pinsRefetch}
            onTagClick={handleTagFromAggregations}
          />
        )}

        {activeTab === 'users' && (
          <UsersTabContent
            query={urlParams.query}
            users={users}
            totalHits={usersTotalHits}
            took={usersTook}
            isLoading={isUsersLoading}
            isFetchingNextPage={isUsersFetchingNext}
            hasNextPage={usersHasNext}
            isError={isUsersError}
            onFetchNextPage={usersFetchNext}
            onRefetch={usersRefetch}
          />
        )}

        {activeTab === 'boards' && (
          <BoardsTabContent
            query={urlParams.query}
            boards={boards}
            totalHits={boardsTotalHits}
            took={boardsTook}
            isLoading={isBoardsLoading}
            isFetchingNextPage={isBoardsFetchingNext}
            hasNextPage={boardsHasNext}
            isError={isBoardsError}
            onFetchNextPage={boardsFetchNext}
            onRefetch={boardsRefetch}
          />
        )}
      </Box>
    </Box>
  );
};

// ============ Empty State ============
interface SearchEmptyStateProps {
  history: string[];
  onHistoryClick: (query: string) => void;
  onClearHistory: () => void;
}

const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  history,
  onHistoryClick,
  onClearHistory,
}) => (
  <Box paddingY={6}>
    {history.length > 0 ? (
      <Box marginBottom={6}>
        <Box marginBottom={3}>
          <Flex justifyContent="between" alignItems="center">
            <Text weight="bold" size="300">Recent Searches</Text>
            <Button
              text="Clear all"
              onClick={onClearHistory}
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
              onClick={() => onHistoryClick(query)}
            />
          ))}
        </Flex>
      </Box>
    ) : (
      <Box marginBottom={6}>
        <EmptyState
          title="Search for something"
          description="Enter a search term to find pins, users, or boards"
          icon="search"
        />
      </Box>
    )}

    {/* Categories for discovery */}
    <CategoryGrid 
      limit={8} 
      size="md" 
      title="Explore Categories"
      showTitle
    />
  </Box>
);

// ============ Pins Tab ============
interface PinsTabContentProps {
  query: string;
  pins: PinSearchResult[];
  totalHits: number;
  took: number;
  aggregations: Aggregations | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  onFetchNextPage: () => void;
  onRefetch: () => void;
  onTagClick: (tag: string) => void;
}

const PinsTabContent: React.FC<PinsTabContentProps> = ({
  query,
  pins,
  totalHits,
  took,
  aggregations,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  isError,
  onFetchNextPage,
  onRefetch,
  onTagClick,
}) => (
  <Box>
    <SearchResultsHeader
      query={query}
      totalHits={totalHits}
      took={took}
      type="pins"
      isLoading={isLoading}
    />
    
    {aggregations && (
      <Box marginBottom={4}>
        <SearchAggregations
          aggregations={aggregations}
          onTagClick={onTagClick}
        />
      </Box>
    )}
    
    {isError ? (
      <ErrorMessage
        title="Failed to search pins"
        message="Please try again"
        onRetry={onRefetch}
      />
    ) : (
      <SearchPinGrid
        pins={pins}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={onFetchNextPage}
        emptyMessage={`No pins found for "${query}"`}
      />
    )}
  </Box>
);

// ============ Users Tab ============
interface UsersTabContentProps {
  query: string;
  users: UserSearchResult[];
  totalHits: number;
  took: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  onFetchNextPage: () => void;
  onRefetch: () => void;
}

const UsersTabContent: React.FC<UsersTabContentProps> = ({
  query,
  users,
  totalHits,
  took,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  isError,
  onFetchNextPage,
  onRefetch,
}) => {
  if (isError) {
    return (
      <ErrorMessage
        title="Failed to search users"
        message="Please try again"
        onRetry={onRefetch}
      />
    );
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (users.length === 0) {
    return (
      <EmptyState
        title="No users found"
        description={`No users matching "${query}"`}
        icon="person"
      />
    );
  }

  return (
    <Box>
      <SearchResultsHeader
        query={query}
        totalHits={totalHits}
        took={took}
        type="users"
        isLoading={isLoading}
      />
      
      <Flex direction="column" gap={2}>
        {users.map((user) => (
          <SearchUserCard key={user.id} user={user} />
        ))}
      </Flex>
      
      {isFetchingNextPage && (
        <Box display="flex" justifyContent="center" padding={4}>
          <Spinner accessibilityLabel="Loading more users" show />
        </Box>
      )}
      
      {hasNextPage && !isFetchingNextPage && (
        <Box display="flex" justifyContent="center" padding={4}>
          <Button
            text="Load more"
            onClick={onFetchNextPage}
            size="lg"
            color="gray"
          />
        </Box>
      )}
    </Box>
  );
};

// ============ Boards Tab ============
interface BoardsTabContentProps {
  query: string;
  boards: BoardSearchResult[];
  totalHits: number;
  took: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  isError: boolean;
  onFetchNextPage: () => void;
  onRefetch: () => void;
}

const BoardsTabContent: React.FC<BoardsTabContentProps> = ({
  query,
  boards,
  totalHits,
  took,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  isError,
  onFetchNextPage,
  onRefetch,
}) => {
  if (isError) {
    return (
      <ErrorMessage
        title="Failed to search boards"
        message="Please try again"
        onRetry={onRefetch}
      />
    );
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (boards.length === 0) {
    return (
      <EmptyState
        title="No boards found"
        description={`No boards matching "${query}"`}
        icon="board"
      />
    );
  }

  return (
    <Box>
      <SearchResultsHeader
        query={query}
        totalHits={totalHits}
        took={took}
        type="boards"
        isLoading={isLoading}
      />
      
      <Flex gap={4} wrap>
        {boards.map((board) => (
          <Box key={board.id} width={236}>
            <SearchBoardCard board={board} />
          </Box>
        ))}
      </Flex>
      
      {isFetchingNextPage && (
        <Box display="flex" justifyContent="center" padding={4}>
          <Spinner accessibilityLabel="Loading more boards" show />
        </Box>
      )}
      
      {hasNextPage && !isFetchingNextPage && (
        <Box display="flex" justifyContent="center" padding={4}>
          <Button
            text="Load more"
            onClick={onFetchNextPage}
            size="lg"
            color="gray"
          />
        </Box>
      )}
    </Box>
  );
};

export default SearchPage;