// src/modules/search/components/SearchFilters.tsx

import React from 'react';
import { Box, Flex, Button, IconButton, Tooltip } from 'gestalt';
import { TagInput } from '@/modules/tag';
import { SearchSortSelect } from './SearchSortSelect';
import { SearchDateRangePicker } from './SearchDateRangePicker';
import type { SearchSortBy } from '../types/search.types';

interface SearchFiltersProps {
  // Tags
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  
  // Sort
  sortBy: SearchSortBy;
  onSortChange: (sortBy: SearchSortBy) => void;
  
  // Date range
  dateFrom: Date | null;
  dateTo: Date | null;
  onDateFromChange: (date: Date | null) => void;
  onDateToChange: (date: Date | null) => void;
  
  // Fuzzy
  fuzzy: boolean;
  onFuzzyChange: (fuzzy: boolean) => void;
  
  // Actions
  onClear: () => void;
  
  // Layout
  compact?: boolean;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  selectedTags,
  onTagsChange,
  sortBy,
  onSortChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  fuzzy,
  onFuzzyChange,
  onClear,
  compact = false,
}) => {
  const hasFilters = selectedTags.length > 0 || dateFrom || dateTo || sortBy !== 'RELEVANCE';

  if (compact) {
    return (
      <Flex gap={2} alignItems="center" wrap>
        <SearchSortSelect value={sortBy} onChange={onSortChange} size="md" />
        
        <SearchDateRangePicker
          fromDate={dateFrom}
          toDate={dateTo}
          onFromChange={onDateFromChange}
          onToChange={onDateToChange}
        />
        
        <Tooltip text={fuzzy ? 'Fuzzy search on' : 'Exact match'}>
          <IconButton
            accessibilityLabel="Toggle fuzzy search"
            icon="sparkle"
            size="md"
            bgColor={fuzzy ? 'red' : 'gray'}
            iconColor={fuzzy ? 'white' : 'darkGray'}
            onClick={() => onFuzzyChange(!fuzzy)}
          />
        </Tooltip>
        
        {hasFilters && (
          <Button
            text="Clear"
            onClick={onClear}
            size="sm"
            color="gray"
          />
        )}
      </Flex>
    );
  }

  return (
    <Box padding={4} color="secondary" rounding={4}>
      <Flex gap={4} direction="column">
        <Flex gap={4} alignItems="end" wrap>
          {/* Sort */}
          <SearchSortSelect value={sortBy} onChange={onSortChange} />
          
          {/* Date Range */}
          <SearchDateRangePicker
            fromDate={dateFrom}
            toDate={dateTo}
            onFromChange={onDateFromChange}
            onToChange={onDateToChange}
          />
          
          {/* Fuzzy Toggle */}
          <Tooltip text={fuzzy ? 'Fuzzy search enabled' : 'Exact match mode'}>
            <IconButton
              accessibilityLabel="Toggle fuzzy search"
              icon="sparkle"
              size="lg"
              bgColor={fuzzy ? 'red' : 'gray'}
              iconColor={fuzzy ? 'white' : 'darkGray'}
              onClick={() => onFuzzyChange(!fuzzy)}
            />
          </Tooltip>
          
          {hasFilters && (
            <Button
              text="Clear filters"
              onClick={onClear}
              size="lg"
              color="gray"
            />
          )}
        </Flex>
        
        {/* Tags Filter */}
        <Box maxWidth={500}>
          <TagInput
            id="search-tags-filter"
            label="Filter by tags"
            selectedTags={selectedTags}
            onChange={onTagsChange}
            placeholder="Add tags to filter..."
            maxTags={5}
          />
        </Box>
      </Flex>
    </Box>
  );
};

export default SearchFilters;