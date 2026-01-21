// src/shared/components/layout/SearchDropdown.tsx

import React, { useCallback } from 'react';
import { Box, Flex, Text, TapArea, Icon, Spinner, Mask } from 'gestalt';
import { useImageUrl } from '@/modules/storage';
import type { Suggestion, TrendingQuery } from '@/modules/search';
import type { CategoryResponse } from '@/modules/tag';

// ============ Types ============
interface RecentSearch {
  query: string;
  timestamp?: number;
}

// ============ Styles ============
const dropdownStyles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.1)',
    maxHeight: '70vh',
    overflowY: 'auto' as const,
  },
};

// ============ Recent Search Item ============
interface RecentItemProps {
  query: string;
  isFocused: boolean;
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
}

const RecentItem: React.FC<RecentItemProps> = ({
  query,
  isFocused,
  onSelect,
  onRemove,
}) => {
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(query);
  }, [query, onRemove]);

  return (
    <TapArea onTap={() => onSelect(query)} rounding={2}>
      <Box
        padding={2}
        rounding={2}
        color={isFocused ? 'secondary' : 'transparent'}
        display="flex"
        alignItems="center"
      >
        <Flex gap={3} alignItems="center" flex="grow">
          <Box
            width={32}
            height={32}
            rounding="circle"
            color="secondary"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon accessibilityLabel="" icon="clock" size={16} color="subtle" />
          </Box>
          <Text size="200">{query}</Text>
        </Flex>
        <TapArea onTap={handleRemove as () => void} rounding="circle" tapStyle="compress">
          <Box
            padding={1}
            rounding="circle"
            dangerouslySetInlineStyle={{
              __style: { opacity: 0.6 },
            }}
          >
            <Icon accessibilityLabel="Remove" icon="cancel" size={12} color="subtle" />
          </Box>
        </TapArea>
      </Box>
    </TapArea>
  );
};

// ============ Trending Tag ============
interface TrendingTagProps {
  query: string;
  emoji?: string;
  onSelect: (query: string) => void;
}

const TrendingTag: React.FC<TrendingTagProps> = ({ query, emoji = '🔥', onSelect }) => (
  <TapArea onTap={() => onSelect(query)} rounding="pill">
    <Box
      paddingX={3}
      paddingY={2}
      rounding="pill"
      color="secondary"
      display="flex"
      alignItems="center"
    >
      <Flex gap={1} alignItems="center">
        <Text size="100">{emoji}</Text>
        <Text size="200" weight="bold">{query}</Text>
      </Flex>
    </Box>
  </TapArea>
);

// ============ Category Card ============
interface CategoryCardProps {
  category: CategoryResponse;
  onSelect: (query: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onSelect }) => {
  const imageId = category.pin?.thumbnailId || category.pin?.imageId;
  const { data: imageData } = useImageUrl(imageId, { enabled: !!imageId });

  return (
    <TapArea onTap={() => onSelect(category.tagName)} rounding={3}>
      <Box position="relative" rounding={3} overflow="hidden">
        <Mask rounding={3}>
          <Box
            width="100%"
            dangerouslySetInlineStyle={{ __style: { aspectRatio: '1' } }}
            color="secondary"
          >
            {imageData?.url && (
              <img
                src={imageData.url}
                alt={category.tagName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            )}
          </Box>
        </Mask>
        <Box
          position="absolute"
          bottom
          left
          right
          padding={2}
          dangerouslySetInlineStyle={{
            __style: {
              background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 100%)',
            },
          }}
        >
          <Text color="inverse" weight="bold" size="100">
            {category.tagName}
          </Text>
        </Box>
      </Box>
    </TapArea>
  );
};

// ============ Suggestion Item ============
interface SuggestionItemProps {
  suggestion: Suggestion;
  query: string;
  isFocused: boolean;
  onSelect: (text: string) => void;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({
  suggestion,
  query,
  isFocused,
  onSelect,
}) => {
  const { data: imageData } = useImageUrl(suggestion.imageId, {
    enabled: !!suggestion.imageId,
  });

  // Highlight matching text
  const getHighlightedText = () => {
    if (!query) return suggestion.text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = suggestion.text.split(regex);
    return parts.map((part) => 
      regex.test(part) ? <strong key={`highlight-${part}-${suggestion.text}`}>{part}</strong> : part
    );
  };

  const isUser = suggestion.type === 'USERNAME';
  const getIconName = (): 'person' | 'tag' | 'search' => {
    if (isUser) return 'person';
    if (suggestion.type === 'TAG') return 'tag';
    return 'search';
  };

  return (
    <TapArea onTap={() => onSelect(suggestion.text)} rounding={2}>
      <Box
        padding={2}
        rounding={2}
        color={isFocused ? 'secondary' : 'transparent'}
        display="flex"
        alignItems="center"
      >
        <Flex gap={3} alignItems="center" flex="grow">
          <Box
            width={40}
            height={40}
            rounding={isUser ? 'circle' : 2}
            color="secondary"
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            {imageData?.url ? (
              <img
                src={imageData.url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Icon accessibilityLabel="" icon={getIconName()} size={18} color="subtle" />
            )}
          </Box>
          <Flex direction="column">
            <Text size="200">{getHighlightedText()}</Text>
            {suggestion.type !== 'PIN_TITLE' && (
              <Text size="100" color="subtle">
                {suggestion.type === 'USERNAME' ? 'User' : 'Tag'}
              </Text>
            )}
          </Flex>
        </Flex>
      </Box>
    </TapArea>
  );
};

// ============ Search For Item ============
interface SearchForItemProps {
  query: string;
  isFocused: boolean;
  onSelect: (query: string) => void;
}

const SearchForItem: React.FC<SearchForItemProps> = ({ query, isFocused, onSelect }) => (
  <TapArea onTap={() => onSelect(query)} rounding={2}>
    <Box
      padding={2}
      rounding={2}
      color={isFocused ? 'secondary' : 'transparent'}
      display="flex"
      alignItems="center"
    >
      <Flex gap={3} alignItems="center">
        <Box
          width={40}
          height={40}
          rounding={2}
          color="secondary"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon accessibilityLabel="" icon="search" size={18} color="default" />
        </Box>
        <Text size="200">
          Search for &quot;<Text inline weight="bold">{query}</Text>&quot;
        </Text>
      </Flex>
    </Box>
  </TapArea>
);

// ============ Main Dropdown Component ============
export interface SearchDropdownProps {
  // State
  isOpen: boolean;
  query: string;
  focusedIndex: number;
  
  // Data
  recentSearches: RecentSearch[] | string[];
  trending: TrendingQuery[];
  categories: CategoryResponse[];
  suggestions: Suggestion[];
  
  // Loading
  isLoadingSuggestions?: boolean;
  
  // Callbacks
  onSelect: (query: string) => void;
  onRemoveRecent: (query: string) => void;
  onClearAllRecent: () => void;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  isOpen,
  query,
  focusedIndex,
  recentSearches,
  trending,
  categories,
  suggestions,
  isLoadingSuggestions = false,
  onSelect,
  onRemoveRecent,
  onClearAllRecent,
}) => {
  // Normalize recent searches to strings
  const recentQueries = recentSearches.map(r => 
    typeof r === 'string' ? r : r.query
  );

  const hasQuery = query.trim().length > 0;
  const hasRecent = recentQueries.length > 0;
  const hasTrending = trending.length > 0;
  const hasCategories = categories.length > 0;

  if (!isOpen) return null;

  // Calculate total items for keyboard navigation
  let currentIndex = 0;

  return (
    <Box
      position="absolute"
      top
      dangerouslySetInlineStyle={{ 
        __style: { 
          ...dropdownStyles.container,
          left: 0,
          right: 0,
          marginTop: '8px',
        } 
      }}
    >
      {/* Initial State: Recent + Trending + Categories */}
      {!hasQuery && (
        <>
          {/* Recent Searches */}
          {hasRecent && (
            <Box
              padding={4}
              dangerouslySetInlineStyle={{
                __style: { borderBottom: '1px solid #f0f0f0' },
              }}
            >
              <Box marginBottom={3}>
                <Flex justifyContent="between" alignItems="center">
                  <Text size="100" weight="bold" color="subtle">
                    RECENT SEARCHES
                  </Text>
                  <TapArea onTap={onClearAllRecent}>
                    <Text size="100" color="subtle">Clear all</Text>
                  </TapArea>
                </Flex>
              </Box>
              <Flex direction="column" gap={1}>
                {recentQueries.slice(0, 5).map((q) => {
                  const itemIndex = currentIndex++;
                  return (
                    <RecentItem
                      key={q}
                      query={q}
                      isFocused={focusedIndex === itemIndex}
                      onSelect={onSelect}
                      onRemove={onRemoveRecent}
                    />
                  );
                })}
              </Flex>
            </Box>
          )}

          {/* Trending */}
          {hasTrending && (
            <Box
              padding={4}
              dangerouslySetInlineStyle={{
                __style: { borderBottom: hasCategories ? '1px solid #f0f0f0' : undefined },
              }}
            >
              <Box marginBottom={3}>
                <Text size="100" weight="bold" color="subtle">
                  TRENDING
                </Text>
              </Box>
              <Flex gap={2} wrap>
                {trending.slice(0, 6).map((t) => (
                  <TrendingTag
                    key={t.query}
                    query={t.query}
                    onSelect={onSelect}
                  />
                ))}
              </Flex>
            </Box>
          )}

          {/* Categories */}
          {hasCategories && (
            <Box padding={4}>
              <Box marginBottom={3}>
                <Text size="100" weight="bold" color="subtle">
                  POPULAR CATEGORIES
                </Text>
              </Box>
              <Box
                dangerouslySetInlineStyle={{
                  __style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                  },
                }}
              >
                {categories.slice(0, 8).map((cat) => (
                  <CategoryCard
                    key={cat.tagId}
                    category={cat}
                    onSelect={onSelect}
                  />
                ))}
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Suggestions State (when typing) */}
      {hasQuery && (
        <Box padding={4}>
          {isLoadingSuggestions ? (
            <Box display="flex" justifyContent="center" padding={4}>
              <Spinner accessibilityLabel="Loading suggestions" show size="sm" />
            </Box>
          ) : (
            <Flex direction="column" gap={1}>
              {/* Suggestions */}
              {suggestions.slice(0, 6).map((s) => {
                const itemIndex = currentIndex++;
                return (
                  <SuggestionItem
                    key={`${s.type}-${s.text}`}
                    suggestion={s}
                    query={query}
                    isFocused={focusedIndex === itemIndex}
                    onSelect={onSelect}
                  />
                );
              })}

              {/* Search for query */}
              <SearchForItem
                query={query}
                isFocused={focusedIndex === currentIndex}
                onSelect={onSelect}
              />
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SearchDropdown;