// src/modules/tag/components/TagSearch.tsx

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  SearchField, 
  Flex, 
  Text, 
  TapArea, 
  Spinner,
  Popover,
  Icon,
} from 'gestalt';
import { useSearchTags } from '../hooks/useSearchTags';
import { TagChip } from './TagChip';
import type { TagResponse } from '../types/tag.types';

interface TagSearchProps {
  onTagSelect?: (tag: TagResponse) => void;
  placeholder?: string;
  showRecentTags?: boolean;
  recentTags?: TagResponse[];
  maxSuggestions?: number;
  navigateOnSelect?: boolean;
}

export const TagSearch: React.FC<TagSearchProps> = ({
  onTagSelect,
  placeholder = 'Search tags...',
  showRecentTags = false,
  recentTags = [],
  maxSuggestions = 8,
  navigateOnSelect = true,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const { data: suggestions, isLoading } = useSearchTags(query, {
    limit: maxSuggestions,
    enabled: query.length > 0,
  });

  const setAnchorRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setAnchorElement(node);
    }
  }, []);

  const handleChange = useCallback(({ value }: { value: string }) => {
    setQuery(value);
    if (value.length > 0) {
      setIsOpen(true);
    }
  }, []);

  const handleTagSelect = useCallback((tag: TagResponse) => {
    if (onTagSelect) {
      onTagSelect(tag);
    } else if (navigateOnSelect) {
      navigate(`/search?q=${encodeURIComponent(tag.name)}`);
    }
    setQuery('');
    setIsOpen(false);
  }, [onTagSelect, navigateOnSelect, navigate]);

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setIsOpen(false);
    }
  }, [query, navigate]);

  const handleKeyDown = useCallback(
    ({ event }: { event: React.KeyboardEvent<HTMLInputElement> }) => {
      if (event.key === 'Enter') {
        handleSubmit();
      } else if (event.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [handleSubmit]
  );

  const handleFocus = useCallback(() => {
    if (query.length > 0 || (showRecentTags && recentTags.length > 0)) {
      setIsOpen(true);
    }
  }, [query, showRecentTags, recentTags]);

  const showDropdown = isOpen && (
    (suggestions && suggestions.length > 0) || 
    (showRecentTags && recentTags.length > 0 && !query) ||
    query.trim()
  );

  return (
    <Box width="100%" ref={setAnchorRef}>
      <SearchField
        id="tag-search"
        accessibilityLabel="Search tags"
        accessibilityClearButtonLabel="Clear search"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        autoComplete="off"
      />

      {showDropdown && anchorElement && (
        <Popover
          anchor={anchorElement}
          onDismiss={() => setIsOpen(false)}
          idealDirection="down"
          positionRelativeToAnchor={false}
          size="flexible"
          color="white"
        >
          <Box padding={2} minWidth={280} maxHeight={400} overflow="auto">
            {/* Loading state */}
            {isLoading && (
              <Box padding={3} display="flex" justifyContent="center">
                <Spinner accessibilityLabel="Searching tags" show size="sm" />
              </Box>
            )}

            {/* Search suggestions */}
            {!isLoading && suggestions && suggestions.length > 0 && (
              <Box>
                <Box paddingX={2} paddingY={1}>
                  <Text size="100" color="subtle" weight="bold">
                    Tags
                  </Text>
                </Box>
                <Flex direction="column" gap={1}>
                  {suggestions.map((tag) => (
                    <TapArea
                      key={tag.id}
                      onTap={() => handleTagSelect(tag)}
                      rounding={2}
                    >
                      <Box padding={2} display="flex" alignItems="center">
                        <Flex alignItems="center" gap={2}>
                          <Icon 
                            accessibilityLabel="" 
                            icon="tag" 
                            size={16} 
                            color="subtle" 
                          />
                          <Text size="200">{tag.name}</Text>
                        </Flex>
                      </Box>
                    </TapArea>
                  ))}
                </Flex>
              </Box>
            )}

            {/* Recent tags */}
            {!query && showRecentTags && recentTags.length > 0 && (
              <Box>
                <Box paddingX={2} paddingY={1}>
                  <Text size="100" color="subtle" weight="bold">
                    Recent Tags
                  </Text>
                </Box>
                <Box paddingX={2} paddingY={1}>
                  <Flex wrap gap={2}>
                    {recentTags.slice(0, 5).map((tag) => (
                      <TagChip
                        key={tag.id}
                        tag={tag}
                        size="sm"
                        onClick={() => handleTagSelect(tag)}
                      />
                    ))}
                  </Flex>
                </Box>
              </Box>
            )}

            {/* Search for query */}
            {query.trim() && !isLoading && (
              <TapArea onTap={handleSubmit} rounding={2}>
                <Box 
                  padding={2} 
                  marginTop={suggestions && suggestions.length > 0 ? 1 : 0}
                  color="secondary"
                  rounding={2}
                >
                  <Flex alignItems="center" gap={2}>
                    <Icon 
                      accessibilityLabel="" 
                      icon="search" 
                      size={16} 
                      color="default" 
                    />
                    <Text size="200">
                      Search for "<Text weight="bold" inline>{query}</Text>"
                    </Text>
                  </Flex>
                </Box>
              </TapArea>
            )}

            {/* No results */}
            {!isLoading && 
             query && 
             (!suggestions || suggestions.length === 0) && (
              <Box padding={2}>
                <Text size="200" color="subtle">
                  No tags found matching "{query}"
                </Text>
              </Box>
            )}
          </Box>
        </Popover>
      )}
    </Box>
  );
};

export default TagSearch;