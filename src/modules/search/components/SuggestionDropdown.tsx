// src/modules/search/components/SuggestionDropdown.tsx

import React from 'react';
import { Box, Flex, Text, Icon, TapArea, Spinner } from 'gestalt';
import { useImageUrl } from '@/modules/storage';
import type { Suggestion, TrendingQuery, SearchHistoryItem } from '../types/search.types';

interface SuggestionItemProps {
  suggestion: Suggestion;
  onClick: (text: string) => void;
  isFocused?: boolean;
}

const getIconForType = (type: Suggestion['type']): 'tag' | 'person' | 'pin' => {
  switch (type) {
    case 'TAG':
      return 'tag';
    case 'USERNAME':
      return 'person';
    default:
      return 'pin';
  }
};

const getTypeLabel = (type: Suggestion['type']): string => {
  switch (type) {
    case 'TAG':
      return 'Tag';
    case 'USERNAME':
      return 'User';
    default:
      return 'Pin';
  }
};

const SuggestionItem: React.FC<SuggestionItemProps> = ({
  suggestion,
  onClick,
  isFocused = false,
}) => {
  const { data: imageData } = useImageUrl(suggestion.imageId, {
    enabled: !!suggestion.imageId,
  });

  const icon = getIconForType(suggestion.type);
  const typeLabel = getTypeLabel(suggestion.type);

  return (
    <TapArea onTap={() => onClick(suggestion.text)} rounding={2}>
      <Box
        padding={2}
        rounding={2}
        color={isFocused ? 'secondary' : 'transparent'}
      >
        <Flex alignItems="center" gap={3}>
          {imageData?.url ? (
            <Box width={32} height={32} rounding={2} overflow="hidden">
              <img
                src={imageData.url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          ) : (
            <Box
              width={32}
              height={32}
              color="secondary"
              rounding={2}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon accessibilityLabel="" icon={icon} size={16} color="subtle" />
            </Box>
          )}
          
          <Box flex="grow">
            <Text size="200" weight="bold">
              {suggestion.text}
            </Text>
            <Text size="100" color="subtle">
              {typeLabel}
            </Text>
          </Box>
        </Flex>
      </Box>
    </TapArea>
  );
};

interface SuggestionDropdownProps {
  suggestions?: Suggestion[];
  trending?: TrendingQuery[];
  history?: SearchHistoryItem[];
  isLoading?: boolean;
  onSuggestionClick: (text: string) => void;
  onHistoryClick?: (text: string) => void;
  onTrendingClick?: (text: string) => void;
  onClearHistory?: () => void;
  focusedIndex?: number;
  showTrending?: boolean;
  showHistory?: boolean;
}

export const SuggestionDropdown: React.FC<SuggestionDropdownProps> = ({
  suggestions = [],
  trending = [],
  history = [],
  isLoading = false,
  onSuggestionClick,
  onHistoryClick,
  onTrendingClick,
  onClearHistory,
  focusedIndex = -1,
  showTrending = true,
  showHistory = true,
}) => {
  const hasSuggestions = suggestions.length > 0;
  const hasTrending = showTrending && trending.length > 0;
  const hasHistory = showHistory && history.length > 0;

  if (isLoading) {
    return (
      <Box padding={4} display="flex" justifyContent="center">
        <Spinner accessibilityLabel="Loading suggestions" show size="sm" />
      </Box>
    );
  }

  if (!hasSuggestions && !hasTrending && !hasHistory) {
    return null;
  }

  return (
    <Box>
      {/* Search History */}
      {hasHistory && !hasSuggestions && (
        <Box marginBottom={hasTrending ? 2 : 0}>
          <Box paddingX={2} paddingY={1}>
            <Flex justifyContent="between" alignItems="center">
              <Text size="100" color="subtle" weight="bold">
                Recent searches
              </Text>
              {onClearHistory && (
                <TapArea onTap={onClearHistory}>
                  <Text size="100" color="subtle">
                    Clear
                  </Text>
                </TapArea>
              )}
            </Flex>
          </Box>
          {history.slice(0, 5).map((item, index) => (
            <TapArea
              key={item.query}
              onTap={() => onHistoryClick?.(item.query)}
              rounding={2}
            >
              <Box
                padding={2}
                rounding={2}
                color={focusedIndex === index ? 'secondary' : 'transparent'}
              >
                <Flex alignItems="center" gap={2}>
                  <Icon accessibilityLabel="" icon="clock" size={16} color="subtle" />
                  <Text size="200">{item.query}</Text>
                </Flex>
              </Box>
            </TapArea>
          ))}
        </Box>
      )}

      {/* Trending */}
      {hasTrending && !hasSuggestions && (
        <Box>
          <Box paddingX={2} paddingY={1}>
            <Text size="100" color="subtle" weight="bold">
              Trending
            </Text>
          </Box>
          {trending.slice(0, 5).map((item, index) => {
            const adjustedIndex = hasHistory ? history.length + index : index;
            return (
              <TapArea
                key={item.query}
                onTap={() => onTrendingClick?.(item.query)}
                rounding={2}
              >
                <Box
                  padding={2}
                  rounding={2}
                  color={focusedIndex === adjustedIndex ? 'secondary' : 'transparent'}
                >
                  <Flex alignItems="center" gap={2}>
                    <Icon accessibilityLabel="" icon="trending" size={16} color="subtle" />
                    <Text size="200">{item.query}</Text>
                    <Text size="100" color="subtle">
                      {item.searchCount} searches
                    </Text>
                  </Flex>
                </Box>
              </TapArea>
            );
          })}
        </Box>
      )}

      {/* Suggestions */}
      {hasSuggestions && (
        <Box>
          {suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={`${suggestion.type}-${suggestion.text}`}
              suggestion={suggestion}
              onClick={onSuggestionClick}
              isFocused={focusedIndex === index}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SuggestionDropdown;