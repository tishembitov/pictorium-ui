// src/shared/components/layout/SearchDropdown.tsx

import React, { useMemo } from 'react';
import { Box, Flex, Text, TapArea, Icon, Spinner, Mask } from 'gestalt';
import { useImageUrl } from '@/modules/storage';
import { useSearchPins } from '@/modules/search';
import type { Suggestion, TrendingQuery } from '@/modules/search';
import type { CategoryResponse } from '@/modules/tag';

// ============ Gradient Palettes ============
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)',
];

const getGradient = (index: number) => GRADIENTS[index % GRADIENTS.length];

// ============ Constants ============
const CARDS_PER_ROW = 6;
const MAX_ROWS = 3;
const MAX_CARDS_PER_SECTION = CARDS_PER_ROW * MAX_ROWS; // 18 карточек
const CARD_GAP = 16;

// ============ Styles ============
const dropdownStyles = {
  container: {
    position: 'absolute' as const,
    top: '100%',
    left: '-10%',
    right: '-10%',
    marginTop: '8px',
    backgroundColor: 'white',
    borderRadius: '24px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.2), 0 0 1px rgba(0,0,0,0.1)',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    animation: 'slideDown 0.25s ease-out',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: `repeat(${CARDS_PER_ROW}, 1fr)`,
    gap: `${CARD_GAP}px`,
  },
  divider: {
    borderTop: '1px solid #efefef',
  },
};

// ============ Helper function for icon selection ============
const getIconForSuggestionType = (
  isUser: boolean,
  isTag: boolean
): 'person' | 'tag' | 'search' => {
  if (isUser) return 'person';
  if (isTag) return 'tag';
  return 'search';
};

// ============ Section Header ============
interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => (
  <Flex justifyContent="between" alignItems="center">
    <Text size="400" weight="bold">
      {title}
    </Text>
    {action && (
      <TapArea onTap={action.onClick} rounding={2}>
        <Box padding={2}>
          <Text size="200" color="subtle">
            {action.label}
          </Text>
        </Box>
      </TapArea>
    )}
  </Flex>
);

// ============ Search Card Component ============
interface SearchCardProps {
  title: string;
  imageUrl?: string | null;
  gradient?: string;
  icon?: 'clock' | 'trending' | 'search' | 'tag';
  onClick: () => void;
  onRemove?: () => void;
}

const SearchCard: React.FC<SearchCardProps> = ({
  title,
  imageUrl,
  gradient,
  icon,
  onClick,
  onRemove,
}) => {
  return (
    <Box position="relative">
      <TapArea onTap={onClick} rounding={4}>
        <Box
          position="relative"
          rounding={4}
          overflow="hidden"
          dangerouslySetInlineStyle={{
            __style: {
              aspectRatio: '1',
              background: imageUrl ? undefined : gradient,
            },
          }}
        >
          {/* Background Image */}
          {imageUrl && (
            <Mask rounding={4}>
              <img
                src={imageUrl}
                alt={title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                loading="lazy"
              />
            </Mask>
          )}

          {/* Gradient Overlay */}
          <Box
            position="absolute"
            top
            left
            right
            bottom
            dangerouslySetInlineStyle={{
              __style: {
                background: imageUrl
                  ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
                  : 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
                borderRadius: '16px',
              },
            }}
          />

          {/* Icon Badge */}
          {icon && (
            <Box
              position="absolute"
              dangerouslySetInlineStyle={{
                __style: { top: '10px', left: '10px' },
              }}
            >
              <Box
                width={30}
                height={30}
                rounding="circle"
                display="flex"
                alignItems="center"
                justifyContent="center"
                dangerouslySetInlineStyle={{
                  __style: {
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <Icon accessibilityLabel="" icon={icon} size={14} color="dark" />
              </Box>
            </Box>
          )}

          {/* Title */}
          <Box position="absolute" bottom left right padding={3}>
            <Text color="inverse" weight="bold" size="200" lineClamp={2} align="center">
              {title}
            </Text>
          </Box>
        </Box>
      </TapArea>

      {/* Remove button */}
      {onRemove && (
        <Box
          position="absolute"
          dangerouslySetInlineStyle={{
            __style: { top: '8px', right: '8px', zIndex: 10 },
          }}
        >
          <TapArea
            onTap={(e) => {
              e.event.stopPropagation();
              onRemove();
            }}
            rounding="circle"
            tapStyle="compress"
          >
            <Box
              width={26}
              height={26}
              rounding="circle"
              display="flex"
              alignItems="center"
              justifyContent="center"
              dangerouslySetInlineStyle={{
                __style: { backgroundColor: 'rgba(0,0,0,0.6)' },
              }}
            >
              <Icon accessibilityLabel="Remove" icon="cancel" size={12} color="inverse" />
            </Box>
          </TapArea>
        </Box>
      )}
    </Box>
  );
};

// ============ Recent Card with Image Fetch ============
interface RecentCardProps {
  query: string;
  index: number;
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
}

const RecentCard: React.FC<RecentCardProps> = ({ query, index, onSelect, onRemove }) => {
  const { pins } = useSearchPins({
    q: query,
    pageSize: 1,
    enabled: true,
  });

  const pin = pins[0];
  const imageId = pin?.thumbnailId || pin?.imageId;
  const { data: imageData } = useImageUrl(imageId, { enabled: !!imageId });

  return (
    <SearchCard
      title={query}
      imageUrl={imageData?.url}
      gradient={getGradient(index)}
      icon="clock"
      onClick={() => onSelect(query)}
      onRemove={() => onRemove(query)}
    />
  );
};

// ============ Trending Card with Image Fetch ============
interface TrendingCardProps {
  query: string;
  index: number;
  onSelect: (query: string) => void;
}

const TrendingCard: React.FC<TrendingCardProps> = ({ query, index, onSelect }) => {
  const { pins } = useSearchPins({
    q: query,
    pageSize: 1,
    enabled: true,
  });

  const pin = pins[0];
  const imageId = pin?.thumbnailId || pin?.imageId;
  const { data: imageData } = useImageUrl(imageId, { enabled: !!imageId });

  return (
    <SearchCard
      title={query}
      imageUrl={imageData?.url}
      gradient={getGradient(index + 4)}
      icon="trending"
      onClick={() => onSelect(query)}
    />
  );
};

// ============ Category Card ============
interface CategoryCardProps {
  category: CategoryResponse;
  index: number;
  onSelect: (query: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, index, onSelect }) => {
  const imageId = category.pin?.thumbnailId || category.pin?.imageId;
  const { data: imageData } = useImageUrl(imageId, { enabled: !!imageId });

  return (
    <SearchCard
      title={category.tagName}
      imageUrl={imageData?.url}
      gradient={getGradient(index + 2)}
      onClick={() => onSelect(category.tagName)}
    />
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

  const getHighlightedText = () => {
    if (!query) return suggestion.text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = suggestion.text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <strong key={`${suggestion.text}-${part}-${i}`}>{part}</strong> : part
    );
  };

  const isUser = suggestion.type === 'USERNAME';
  const isTag = suggestion.type === 'TAG';
  const suggestionIcon = getIconForSuggestionType(isUser, isTag);

  return (
    <TapArea onTap={() => onSelect(suggestion.text)} rounding={2}>
      <Box
        padding={4}
        rounding={2}
        color={isFocused ? 'secondary' : 'transparent'}
        display="flex"
        alignItems="center"
      >
        <Box
          width={52}
          height={52}
          rounding={isUser ? 'circle' : 3}
          color="secondary"
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
          marginEnd={4}
        >
          {imageData?.url ? (
            <img
              src={imageData.url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Icon
              accessibilityLabel=""
              icon={suggestionIcon}
              size={24}
              color="subtle"
            />
          )}
        </Box>

        <Box flex="grow">
          <Text size="300" weight="bold">
            {getHighlightedText()}
          </Text>
          {(isUser || isTag) && (
            <Text size="200" color="subtle">
              {isUser ? 'User' : 'Tag'}
            </Text>
          )}
        </Box>

        <Icon accessibilityLabel="" icon="arrow-up-right" size={20} color="subtle" />
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
      padding={4}
      rounding={2}
      color={isFocused ? 'secondary' : 'transparent'}
      display="flex"
      alignItems="center"
    >
      <Box
        width={52}
        height={52}
        rounding={3}
        display="flex"
        alignItems="center"
        justifyContent="center"
        marginEnd={4}
        dangerouslySetInlineStyle={{
          __style: { backgroundColor: '#e60023' },
        }}
      >
        <Icon accessibilityLabel="" icon="search" size={24} color="inverse" />
      </Box>

      <Box flex="grow">
        <Text size="300">
          Search for "<Text inline weight="bold">{query}</Text>"
        </Text>
      </Box>

      <Icon accessibilityLabel="" icon="arrow-forward" size={20} color="default" />
    </Box>
  </TapArea>
);

// ============ Main Dropdown Component ============
export interface SearchDropdownProps {
  isOpen: boolean;
  query: string;
  focusedIndex: number;
  recentSearches: string[];
  trending: TrendingQuery[];
  categories: CategoryResponse[];
  suggestions: Suggestion[];
  isLoadingSuggestions?: boolean;
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
  const hasQuery = query.trim().length > 0;
  const hasRecent = recentSearches.length > 0;
  const hasTrending = trending.length > 0;
  const hasCategories = categories.length > 0;
  const hasSuggestions = suggestions.length > 0;

  const limitedRecent = useMemo(
    () => recentSearches.slice(0, MAX_CARDS_PER_SECTION),
    [recentSearches]
  );
  const limitedTrending = useMemo(
    () => trending.slice(0, MAX_CARDS_PER_SECTION),
    [trending]
  );
  const limitedCategories = useMemo(
    () => categories.slice(0, MAX_CARDS_PER_SECTION),
    [categories]
  );

  if (!isOpen) return null;

  let currentIndex = 0;

  return (
    <div style={dropdownStyles.container}>
      {/* ============ Initial State (no query) ============ */}
      {!hasQuery && (
        <Box padding={6}>
          {/* Recent Searches */}
          {hasRecent && (
            <Box marginBottom={8}>
              <Box marginBottom={4}>
                <SectionHeader
                  title="Recent"
                  action={{
                    label: 'Clear all',
                    onClick: onClearAllRecent,
                  }}
                />
              </Box>

              <div style={dropdownStyles.cardsGrid}>
                {limitedRecent.map((q) => (
                  <RecentCard
                    key={`recent-${q}`}
                    query={q}
                    index={recentSearches.indexOf(q)}
                    onSelect={onSelect}
                    onRemove={onRemoveRecent}
                  />
                ))}
              </div>
            </Box>
          )}

          {/* Ideas for you (Categories) */}
          {hasCategories && (
            <Box marginBottom={8}>
              <Box marginBottom={4}>
                <SectionHeader title="Ideas for you" />
              </Box>

              <div style={dropdownStyles.cardsGrid}>
                {limitedCategories.map((cat) => (
                  <CategoryCard
                    key={`category-${cat.tagId}`}
                    category={cat}
                    index={categories.indexOf(cat)}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </Box>
          )}

          {/* Popular on Pictorium */}
          {hasTrending && (
            <Box>
              <Box marginBottom={4}>
                <SectionHeader title="Popular on Pictorium" />
              </Box>

              <div style={dropdownStyles.cardsGrid}>
                {limitedTrending.map((t) => (
                  <TrendingCard
                    key={`trending-${t.query}`}
                    query={t.query}
                    index={trending.indexOf(t)}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </Box>
          )}

          {/* Empty state */}
          {!hasRecent && !hasCategories && !hasTrending && (
            <Box padding={8} display="flex" justifyContent="center" alignItems="center">
              <Flex direction="column" alignItems="center" gap={3}>
                <Icon accessibilityLabel="" icon="search" size={48} color="subtle" />
                <Text color="subtle" size="300">
                  Start typing to search
                </Text>
              </Flex>
            </Box>
          )}
        </Box>
      )}

      {/* ============ Suggestions State (has query) ============ */}
      {hasQuery && (
        <Box paddingY={3}>
          {isLoadingSuggestions && !hasSuggestions ? (
            <Box display="flex" justifyContent="center" padding={6}>
              <Spinner accessibilityLabel="Loading suggestions" show size="md" />
            </Box>
          ) : (
            <>
              {hasSuggestions && (
                <Box paddingX={2}>
                  {suggestions.slice(0, 6).map((s) => {
                    const itemIndex = currentIndex++;
                    return (
                      <SuggestionItem
                        key={`suggestion-${s.type}-${s.text}`}
                        suggestion={s}
                        query={query}
                        isFocused={focusedIndex === itemIndex}
                        onSelect={onSelect}
                      />
                    );
                  })}

                  <Box
                    marginTop={2}
                    marginBottom={2}
                    marginStart={4}
                    marginEnd={4}
                    dangerouslySetInlineStyle={{
                      __style: dropdownStyles.divider,
                    }}
                  />
                </Box>
              )}

              <Box paddingX={2}>
                <SearchForItem
                  query={query}
                  isFocused={focusedIndex === currentIndex}
                  onSelect={onSelect}
                />
              </Box>
            </>
          )}
        </Box>
      )}
    </div>
  );
};

export default SearchDropdown;