// src/pages/ExplorePage.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Box, Heading, Tabs, Divider, Flex, Button, Text } from 'gestalt';
import { 
  CategoryGrid, 
  TagSearch, 
  TagList, 
  TagInput,
  useSearchTags,
  useCategories,
} from '@/modules/tag';
import type { CategoryResponse, TagResponse } from '@/modules/tag';
import { 
  PinGrid, 
  PinSortSelect,
  usePins,
} from '@/modules/pin';
import { usePinPreferencesStore } from '@/modules/pin/stores/pinPreferencesStore';
import type { PinFilter } from '@/modules/pin';
import { EmptyState, LoadingSpinner } from '@/shared/components';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';

type TabIndex = 0 | 1 | 2;

const ExplorePage: React.FC = () => {
  const isMobile = useIsMobile();
  
  // Local state
  const [activeTab, setActiveTab] = useState<TabIndex>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchQuery] = useState('');
  
  const debouncedQuery = useDebounce(tagSearchQuery, 300);

  // Global sort preference
  const sort = usePinPreferencesStore((s) => s.sort);

  // Categories
  const { isLoading: isCategoriesLoading } = useCategories({ limit: 12 });

  // Tag search (only for Tags tab)
  const { data: searchedTags, isLoading: isTagsLoading } = useSearchTags(debouncedQuery, {
    limit: 20,
    enabled: activeTab === 2 && debouncedQuery.length > 0,
  });

  // Build filter for pins
  const pinsFilter = useMemo((): PinFilter => ({
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  }), [selectedTags]);

  // Fetch pins (only when Pins tab is active)
  const {
    pins,
    totalElements,
    isLoading: isPinsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePins(pinsFilter, { 
    sort,
    enabled: activeTab === 1,
  });

  // Handlers
  const handleCategoryClick = useCallback((category: CategoryResponse) => {
    setSelectedTags([category.tagName]);
    setActiveTab(1); // Switch to Pins tab
  }, []);

  const handleTagSelect = useCallback((tag: TagResponse) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag.name)) return prev;
      return [...prev, tag.name];
    });
    setActiveTab(1); // Switch to Pins tab
  }, []);

  const handleTagRemove = useCallback((tagName: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagName));
  }, []);

  const handleClearTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  const handleTabChange = useCallback(({ activeTabIndex }: { activeTabIndex: number }) => {
    setActiveTab(activeTabIndex as TabIndex);
  }, []);

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const handleTagFromSearchClick = useCallback((tagName: string) => {
    handleTagSelect({ id: tagName, name: tagName });
  }, [handleTagSelect]);

  // Tab labels
  const pinsTabLabel = selectedTags.length > 0 
    ? `Pins (${totalElements})` 
    : 'All Pins';

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
            { href: '#pins', text: pinsTabLabel },
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
            {/* Filters Row */}
            <Box marginBottom={4}>
              <Flex gap={4} alignItems="end" wrap>
                {/* Sort */}
                <PinSortSelect />
                
                {/* Tag Input */}
                <Box flex="grow" maxWidth={400}>
                  <TagInput
                    id="explore-tags"
                    label="Filter by tags"
                    selectedTags={selectedTags}
                    onChange={setSelectedTags}
                    placeholder="Add more tags..."
                    maxTags={5}
                  />
                </Box>

                {/* Clear */}
                {selectedTags.length > 0 && (
                  <Button
                    text="Clear tags"
                    onClick={handleClearTags}
                    size="lg"
                    color="gray"
                  />
                )}
              </Flex>
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
                  ? 'No pins found for selected tags'
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

            {/* Manual search input for tracking query */}
            <Box marginBottom={4}>
              <TagInput
                id="tag-search-input"
                label="Search tags"
                selectedTags={[]}
                onChange={() => {}}
                placeholder="Type to search..."
                maxTags={0}
              />
            </Box>

            {isTagsLoading && <LoadingSpinner />}

            {searchedTags && searchedTags.length > 0 && (
              <Box>
                <Text weight="bold" size="300">
                  Results for &quot;{debouncedQuery}&quot;
                </Text>
                <Box marginTop={3}>
                  <TagList
                    tags={searchedTags}
                    size="lg"
                    onClick={handleTagFromSearchClick}
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