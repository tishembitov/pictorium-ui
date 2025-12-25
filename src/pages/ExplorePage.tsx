// src/pages/ExplorePage.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Box, Heading, Tabs, Divider, Flex, Button, Text } from 'gestalt';
import { 
  CategoryGrid, 
  TagSearch, 
  TagList, 
  useSearchTags,
  useCategories,
} from '@/modules/tag';
import { 
  PinGrid, 
  PinFilters, 
  PinTagFilter,
  useInfinitePins, 
  usePinFiltersStore,
} from '@/modules/pin';
import { EmptyState, LoadingSpinner } from '@/shared/components';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import type { CategoryResponse, TagResponse } from '@/modules/tag';

type TabIndex = 0 | 1 | 2;

const ExplorePage: React.FC = () => {
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState<TabIndex>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchQuery] = useState('');
  
  const debouncedQuery = useDebounce(tagSearchQuery, 300);

  // Store - использовать стабильный action getter
  const setTags = usePinFiltersStore((state) => state.setTags);

  // Categories
  const { isLoading: isCategoriesLoading } = useCategories({ limit: 12 });

  // Tag search
  const { data: searchedTags, isLoading: isTagsLoading } = useSearchTags(debouncedQuery, {
    limit: 20,
    enabled: activeTab === 2 && debouncedQuery.length > 0,
  });

  // Memoize filter for pins query
  const pinsFilter = useMemo(() => ({
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  }), [selectedTags]);

  // Pins with selected tags
  const {
    pins,
    totalElements,
    isLoading: isPinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePins(pinsFilter, { enabled: activeTab === 1 });

  const handleCategoryClick = useCallback((category: CategoryResponse) => {
    setSelectedTags([category.tagName]);
    setTags([category.tagName]);
    setActiveTab(1);
  }, [setTags]);

  const handleTagSelect = useCallback((tag: TagResponse) => {
    setSelectedTags((prev) => {
      const newTags = [...prev, tag.name];
      setTags(newTags);
      return newTags;
    });
    setActiveTab(1);
  }, [setTags]);

  const handleTagRemove = useCallback((tagName: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.filter((t) => t !== tagName);
      setTags(newTags);
      return newTags;
    });
  }, [setTags]);

  const handleClearTags = useCallback(() => {
    setSelectedTags([]);
    setTags([]);
  }, [setTags]);

  const handleTabChange = useCallback(({ activeTabIndex }: { activeTabIndex: number }) => {
    setActiveTab(activeTabIndex as TabIndex);
  }, []);

  const handleFetchNextPage = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  return (
    <Box paddingY={4}>
      {/* Header */}
      <Flex justifyContent="between" alignItems="center" wrap>
        <Box>
          <Heading size="400" accessibilityLevel={1}>
            Explore
          </Heading>
          <Text color="subtle" size="200">
            Discover new ideas and inspiration
          </Text>
        </Box>

        {/* Tag Search */}
        <Box width={isMobile ? '100%' : 300} marginTop={isMobile ? 3 : 0}>
          <TagSearch
            placeholder="Search tags..."
            onTagSelect={handleTagSelect}
            navigateOnSelect={false}
          />
        </Box>
      </Flex>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <Box marginTop={4}>
          <Flex alignItems="center" gap={2} wrap>
            <Text weight="bold" size="200">Filtering by:</Text>
            <TagList
              tags={selectedTags}
              size="md"
              removable
              onRemove={handleTagRemove}
            />
            <Button
              text="Clear all"
              onClick={handleClearTags}
              size="sm"
              color="gray"
            />
          </Flex>
        </Box>
      )}

      {/* Tabs */}
      <Box marginTop={4}>
        <Tabs
          activeTabIndex={activeTab}
          onChange={handleTabChange}
          tabs={[
            { href: '#categories', text: 'Categories' },
            { 
              href: '#pins', 
              text: selectedTags.length > 0 
                ? `Pins (${totalElements})` 
                : 'All Pins' 
            },
            { href: '#tags', text: 'Browse Tags' },
          ]}
        />
      </Box>

      <Divider />

      {/* Tab Content */}
      <Box marginTop={4}>
        {/* Categories Tab */}
        {activeTab === 0 && (
          <Box>
            {isCategoriesLoading ? (
              <LoadingSpinner size="lg" />
            ) : (
              <CategoryGrid
                limit={12}
                size="lg"
                onCategoryClick={handleCategoryClick}
                showTitle={false}
              />
            )}
          </Box>
        )}

        {/* Pins Tab */}
        {activeTab === 1 && (
          <Box>
            {/* Filters */}
            <Box marginBottom={4}>
              <PinFilters showSort showClear showScope={false} />
            </Box>

            {/* Tag Filter */}
            <Box marginBottom={4}>
              <PinTagFilter
                selectedTags={selectedTags}
                onChange={setSelectedTags}
                maxTags={5}
                showSelectedAbove
              />
            </Box>

            {/* Pins Grid */}
            <PinGrid
              pins={pins}
              isLoading={isPinsLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              fetchNextPage={handleFetchNextPage}
              emptyMessage={
                selectedTags.length > 0
                  ? `No pins found for selected tags`
                  : 'No pins to explore yet'
              }
              emptyAction={
                selectedTags.length > 0
                  ? { text: 'Clear tags', onClick: handleClearTags }
                  : undefined
              }
            />
          </Box>
        )}

        {/* Tags Tab */}
        {activeTab === 2 && (
          <Box>
            <Box marginBottom={4}>
              <TagSearch
                placeholder="Search for tags..."
                onTagSelect={handleTagSelect}
                navigateOnSelect={false}
                maxSuggestions={10}
              />
            </Box>

            {isTagsLoading && <LoadingSpinner />}

            {searchedTags && searchedTags.length > 0 && (
              <Box>
                <Text weight="bold" size="300">
                  Results for "{debouncedQuery}"
                </Text>
                <Box marginTop={3}>
                  <TagList
                    tags={searchedTags}
                    size="lg"
                    onClick={(tag) => handleTagSelect({ id: tag, name: tag })}
                  />
                </Box>
              </Box>
            )}

            {!isTagsLoading && debouncedQuery && (!searchedTags || searchedTags.length === 0) && (
              <EmptyState
                title="No tags found"
                description={`No tags matching "${debouncedQuery}"`}
                icon="tag"
              />
            )}

            {!debouncedQuery && (
              <Box>
                <Text color="subtle" align="center">
                  Start typing to search for tags
                </Text>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ExplorePage;