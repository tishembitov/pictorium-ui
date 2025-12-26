// src/pages/SearchPage.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Heading, Text, Tabs, Divider, Flex, Button, SearchField } from 'gestalt';
import { 
  PinGrid, 
  PinSortSelect,
  usePins,
} from '@/modules/pin';
import { usePinPreferencesStore } from '@/modules/pin/stores/pinPreferencesStore';
import type { PinFilter } from '@/modules/pin';
import { 
  TagInput, 
  TagList, 
  TagChip,
  useSearchTags,
} from '@/modules/tag';
import { 
  UserCard, 
  useUserByUsername,
} from '@/modules/user';

import { 
  EmptyState, 
  LoadingSpinner, 
  ErrorMessage,
} from '@/shared/components';
import { useSearchHistoryStore } from '@/shared/stores/searchHistoryStore';
import { useDebounce } from '@/shared/hooks/useDebounce';

type SearchTab = 'pins' | 'users' | 'tags';

// ============================================
// Sub-components
// ============================================

interface PinsTabContentProps {
  query: string;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const PinsTabContent: React.FC<PinsTabContentProps> = ({
  query,
  selectedTags,
  onTagsChange,
}) => {
  const sort = usePinPreferencesStore((s) => s.sort);

  // Build filter
  const filter = useMemo((): PinFilter => ({
    q: query || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  }), [query, selectedTags]);

  const {
    pins,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = usePins(filter, { sort, enabled: !!query });

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isError) {
    return (
      <ErrorMessage
        title="Failed to search pins"
        message="Please try again"
        onRetry={handleRetry}
      />
    );
  }

  return (
    <Box>
      {/* Filters */}
      <Box marginBottom={4}>
        <Flex gap={4} alignItems="end" wrap>
          <PinSortSelect />
          <Box flex="grow" maxWidth={300}>
            <TagInput
              id="search-tags"
              label="Filter by tags"
              selectedTags={selectedTags}
              onChange={onTagsChange}
              placeholder="Add tags..."
              maxTags={5}
            />
          </Box>
        </Flex>
      </Box>

      <PinGrid
        pins={pins}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={handleFetchNextPage}
        emptyMessage={`No pins found for "${query}"`}
      />
    </Box>
  );
};

interface UsersTabContentProps {
  query: string;
}

const UsersTabContent: React.FC<UsersTabContentProps> = ({ query }) => {
  const { user, isLoading, isError } = useUserByUsername(query, {
    enabled: !!query,
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Failed to search users"
        message="Please try again"
      />
    );
  }

  if (user) {
    return (
      <Box maxWidth={500}>
        {/* Исправлено: убран несуществующий проп size */}
        <UserCard 
          user={user} 
          showFollowButton 
          showDescription
          showStats
        />
      </Box>
    );
  }

  return (
    <EmptyState
      title="No users found"
      description={`No users matching "${query}". Try searching by exact username.`}
      icon="person"
    />
  );
};

interface TagsTabContentProps {
  query: string;
  onTagClick: (tagName: string) => void;
}

const TagsTabContent: React.FC<TagsTabContentProps> = ({ query, onTagClick }) => {
  const { data: tags, isLoading, isError } = useSearchTags(query, {
    limit: 30,
    enabled: !!query,
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Failed to search tags"
        message="Please try again"
      />
    );
  }

  if (tags && tags.length > 0) {
    return (
      <Box>
        <TagList 
          tags={tags} 
          size="lg" 
          onClick={onTagClick}
          wrap
          gap={3}
        />
      </Box>
    );
  }

  return (
    <EmptyState
      title="No tags found"
      description={`No tags matching "${query}"`}
      icon="tag"
    />
  );
};

// ============================================
// Main Component
// ============================================

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  // Local state - инициализируем из URL
  const [activeTab, setActiveTab] = useState<SearchTab>('pins');
  const [localQuery, setLocalQuery] = useState(query);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const debouncedQuery = useDebounce(localQuery, 300);

  // Search history
  const addSearch = useSearchHistoryStore((state) => state.addSearch);
  const history = useSearchHistoryStore((state) => state.history);
  const clearHistory = useSearchHistoryStore((state) => state.clearHistory);

  // Синхронизация URL -> localQuery (когда пользователь переходит по ссылке или нажимает назад)
  useEffect(() => {
    // Обновляем локальный стейт только если URL изменился извне
    if (query !== localQuery && query !== debouncedQuery) {
      setLocalQuery(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  // Намеренно исключаем localQuery и debouncedQuery, чтобы избежать циклических обновлений

  // Синхронизация localQuery -> URL (когда пользователь печатает)
  useEffect(() => {
    // Обновляем URL только после debounce и если значение изменилось
    if (debouncedQuery !== query) {
      if (debouncedQuery) {
        setSearchParams({ q: debouncedQuery }, { replace: true });
        addSearch(debouncedQuery);
      } else if (query) {
        // Очищаем URL если запрос пустой
        setSearchParams({}, { replace: true });
      }
    }
  }, [debouncedQuery, query, setSearchParams, addSearch]);

  // Handlers
  const handleTabChange = useCallback(({ activeTabIndex }: { activeTabIndex: number }) => {
    const tabs: SearchTab[] = ['pins', 'users', 'tags'];
    setActiveTab(tabs[activeTabIndex] || 'pins');
  }, []);

  const getTabIndex = useCallback((): number => {
    const tabs: SearchTab[] = ['pins', 'users', 'tags'];
    return tabs.indexOf(activeTab);
  }, [activeTab]);

  const handleSearchChange = useCallback(({ value }: { value: string }) => {
    setLocalQuery(value);
  }, []);

  const handleHistoryClick = useCallback((searchQuery: string) => {
    setLocalQuery(searchQuery);
    setSearchParams({ q: searchQuery });
  }, [setSearchParams]);

  const handleTagClick = useCallback((tagName: string) => {
    setLocalQuery(tagName);
    setSearchParams({ q: tagName });
  }, [setSearchParams]);

  // Empty state - no query
  if (!query) {
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
            placeholder="Search for pins, users, or tags..."
            value={localQuery}
            onChange={handleSearchChange}
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
                  onClick={clearHistory}
                  size="sm"
                  color="gray"
                />
              </Flex>
            </Box>
            <Flex wrap gap={2}>
              {history.slice(0, 10).map((item) => (
                <TagChip
                  key={item.query}
                  tag={item.query}
                  size="md"
                  onClick={() => handleHistoryClick(item.query)}
                />
              ))}
            </Flex>
          </Box>
        )}

        {history.length === 0 && (
          <EmptyState
            title="Search for something"
            description="Enter a search term to find pins, users, or tags"
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
          Search results for &quot;{query}&quot;
        </Heading>
      </Box>

      {/* Search Bar */}
      <Box maxWidth={600} marginBottom={4}>
        <SearchField
          id="search-results"
          accessibilityLabel="Search"
          accessibilityClearButtonLabel="Clear"
          placeholder="Search..."
          value={localQuery}
          onChange={handleSearchChange}
        />
      </Box>

      {/* Tabs */}
      <Box marginBottom={4}>
        <Tabs
          activeTabIndex={getTabIndex()}
          onChange={handleTabChange}
          tabs={[
            { href: '#pins', text: 'Pins' },
            { href: '#users', text: 'Users' },
            { href: '#tags', text: 'Tags' },
          ]}
        />
      </Box>

      <Divider />

      {/* Tab Content */}
      <Box marginTop={4}>
        {activeTab === 'pins' && (
          <PinsTabContent
            query={query}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        )}

        {activeTab === 'users' && (
          <UsersTabContent query={query} />
        )}

        {activeTab === 'tags' && (
          <TagsTabContent query={query} onTagClick={handleTagClick} />
        )}
      </Box>
    </Box>
  );
};

export default SearchPage;