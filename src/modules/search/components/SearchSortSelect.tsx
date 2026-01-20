// src/modules/search/components/SearchSortSelect.tsx

import React from 'react';
import { Box, SelectList } from 'gestalt';
import { SEARCH_SORT_OPTIONS } from '../utils/searchUtils';
import type { SearchSortBy } from '../types/search.types';

interface SearchSortSelectProps {
  value: SearchSortBy;
  onChange: (sortBy: SearchSortBy) => void;
  size?: 'md' | 'lg';
  label?: string;
}

export const SearchSortSelect: React.FC<SearchSortSelectProps> = ({
  value,
  onChange,
  size = 'lg',
  label = 'Sort by',
}) => {
  const handleChange = ({ value: newValue }: { value: string }) => {
    onChange(newValue as SearchSortBy);
  };

  return (
    <Box width={160}>
      <SelectList
        id="search-sort-select"
        label={label}
        labelDisplay="hidden"
        value={value}
        onChange={handleChange}
        size={size}
      >
        {SEARCH_SORT_OPTIONS.map((option) => (
          <SelectList.Option
            key={option.value}
            value={option.value}
            label={option.label}
          />
        ))}
      </SelectList>
    </Box>
  );
};

export default SearchSortSelect;