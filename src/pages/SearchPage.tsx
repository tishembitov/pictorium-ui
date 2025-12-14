// ================================================
// FILE: src/pages/SearchPage.tsx
// ================================================
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Heading, Text, Tabs, Divider, Flex, Button } from 'gestalt';
import { 
  PinGrid, 
  PinFilters,
  PinSearchBar,
  useInfinitePins, 
  usePinFiltersStore,
} from '@/modules/pin';
import type { PinResponse } from '@/modules/pin';
import { 
  UserCard, 
  useUserByUsername,
} from '@/modules/user';
import type { UserResponse } from '@/modules/user';
import { 
  TagList, 
  TagChip,
  useSearchTags,
} from '@/modules/tag';
import type { TagResponse } from '@/modules/tag';
import { 
  EmptyState, 
  LoadingSpinner, 
  ErrorMessage,
} from '@/shared/components';
import { useSearchHistoryStore } from '@/shared/stores/searchHistoryStore';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatCompactNumber } from '@/shared/utils/formatters';

type SearchTab = 'pins' | 'users' | 'tags';

// ============================================
// Sub-components для уменьшения сложности
// ============================================

interface PinsTabContentProps {
  query: string;
  pins: PinResponse[];
  isPinsLoading: boolean;
  isPinsError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetchPins: () => void;
}

const PinsTabContent: React.FC<PinsTabContentProps> = ({
  query,
  pins,
  isPinsLoading,
  isPinsError,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  refetchPins,
}) => {
  if (isPinsError) {
    return (
      <ErrorMessage
        title="Failed to search pins"
        message="Please try again"
        onRetry={refetchPins}
      />
    );
  }

  return (
    <Box>
      <Box marginBottom={4}>
        <PinFilters showSort showTags showClear />
      </Box>
      <PinGrid
        pins={pins}
        isLoading={isPinsLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        emptyMessage={`No pins found for "${query}"`}
      />
    </Box>
  );
};

interface UsersTabContentProps {
  query: string;
  user: UserResponse | undefined;
  isUserLoading: boolean;
  isUserError: boolean;
}

const UsersTabContent: React.FC<UsersTabContentProps> = ({
  query,
  user,
  isUserLoading,
  isUserError,
}) => {
  if (isUserLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (isUserError) {
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
        <UserCard 
          user={user} 
          showFollowButton 
          showDescription 
          showFormattedUsername
          size="lg"
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
  tags: TagResponse[] | undefined;
  isTagsLoading: boolean;
  isTagsError: boolean;
  onTagClick: (tagName: string) => void;
}

const TagsTabContent: React.FC<TagsTabContentProps> = ({
  query,
  tags,
  isTagsLoading,
  isTagsError,
  onTagClick,
}) => {
  if (isTagsLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (isTagsError) {
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
  
  const [activeTab, setActiveTab] = useState<SearchTab>('pins');
  const [localQuery, setLocalQuery] = useState(query);
  
  const debouncedQuery = useDebounce(localQuery, 300);

  // Stores
  const setQuery = usePinFiltersStore((state) => state.setQuery);
  const addSearch = useSearchHistoryStore((state) => state.addSearch);
  const history = useSearchHistoryStore((state) => state.history);
  const clearHistory = useSearchHistoryStore((state) => state.clearHistory);

  // Update URL when local query changes
  useEffect(() => {
    if (debouncedQuery !== query) {
      setSearchParams({ q: debouncedQuery });
      if (debouncedQuery) {
        addSearch(debouncedQuery);
      }
    }
  }, [debouncedQuery, query, setSearchParams, addSearch]);

  // Update filter store
  useEffect(() => {
    setQuery(query);
  }, [query, setQuery]);

  // Pins search
  const {
    pins,
    totalElements: pinsCount,
    isLoading: isPinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError: isPinsError,
    refetch: refetchPins,
  } = useInfinitePins({ q: query }, { enabled: !!query && activeTab === 'pins' });

  // Tags search
  const { 
    data: tags, 
    isLoading: isTagsLoading,
    isError: isTagsError,
  } = useSearchTags(query, {
    limit: 30,
    enabled: !!query && activeTab === 'tags',
  });

  // User search
  const { 
    user, 
    isLoading: isUserLoading,
    isError: isUserError,
  } = useUserByUsername(query, {
    enabled: !!query && activeTab === 'users',
  });

  const handleTabChange = ({ activeTabIndex }: { activeTabIndex: number }) => {
    const tabs: SearchTab[] = ['pins', 'users', 'tags'];
    setActiveTab(tabs[activeTabIndex] || 'pins');
  };

  const getTabIndex = (): number => {
    const tabs: SearchTab[] = ['pins', 'users', 'tags'];
    return tabs.indexOf(activeTab);
  };

  const handleSearchChange = useCallback((value: string) => {
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

  // Build tab labels
  const pinsTabLabel = pinsCount > 0 
    ? `Pins (${formatCompactNumber(pinsCount)})` 
    : 'Pins';
  
  const tagsTabLabel = tags?.length 
    ? `Tags (${tags.length})` 
    : 'Tags';

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
          <PinSearchBar
            placeholder="Search for pins, users, or tags..."
            onSearch={handleSearchChange}
            navigateOnSearch={false}
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
        {activeTab === 'pins' && pinsCount > 0 && (
          <Text color="subtle" size="200">
            {formatCompactNumber(pinsCount)} pins found
          </Text>
        )}
      </Box>

      {/* Search Bar */}
      <Box maxWidth={600} marginBottom={4}>
        <PinSearchBar
          placeholder="Search..."
          onSearch={handleSearchChange}
          navigateOnSearch={false}
        />
      </Box>

      {/* Tabs */}
      <Box marginBottom={4}>
        <Tabs
          activeTabIndex={getTabIndex()}
          onChange={handleTabChange}
          tabs={[
            { href: '#pins', text: pinsTabLabel },
            { href: '#users', text: 'Users' },
            { href: '#tags', text: tagsTabLabel },
          ]}
        />
      </Box>

      <Divider />

      {/* Tab Content */}
      <Box marginTop={4}>
        {activeTab === 'pins' && (
          <PinsTabContent
            query={query}
            pins={pins}
            isPinsLoading={isPinsLoading}
            isPinsError={isPinsError}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            refetchPins={refetchPins}
          />
        )}

        {activeTab === 'users' && (
          <UsersTabContent
            query={query}
            user={user}
            isUserLoading={isUserLoading}
            isUserError={isUserError}
          />
        )}

        {activeTab === 'tags' && (
          <TagsTabContent
            query={query}
            tags={tags}
            isTagsLoading={isTagsLoading}
            isTagsError={isTagsError}
            onTagClick={handleTagClick}
          />
        )}
      </Box>
    </Box>
  );
};

export default SearchPage;