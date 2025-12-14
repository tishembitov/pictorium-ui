// src/modules/pin/components/PinFilters.tsx

import React from 'react';
import { 
  Box, 
  Flex, 
  Button, 
  SelectList, 
  Tooltip,
} from 'gestalt';
import { PinTagFilter } from './PinTagFilter';
import { usePinFiltersStore } from '../stores/pinFiltersStore';
import { PIN_SORT_OPTIONS } from '../types/pinFilter.types';

interface PinFiltersProps {
  showSort?: boolean;
  showTags?: boolean;
  showClear?: boolean;
}

export const PinFilters: React.FC<PinFiltersProps> = ({
  showSort = true,
  showTags = true,
  showClear = true,
}) => {
  const filter = usePinFiltersStore((state) => state.filter);
  const sortField = usePinFiltersStore((state) => state.sortField);
  const sortDirection = usePinFiltersStore((state) => state.sortDirection);
  const setSort = usePinFiltersStore((state) => state.setSort);
  const setTags = usePinFiltersStore((state) => state.setTags);
  const clearFilter = usePinFiltersStore((state) => state.clearFilter);
  const hasActiveFilters = usePinFiltersStore((state) => state.hasActiveFilters);

  const handleSortChange = ({ value }: { value: string }) => {
    const option = PIN_SORT_OPTIONS.find(
      (opt) => `${opt.field}-${opt.direction}` === value
    );
    if (option) {
      setSort(option.field, option.direction);
    }
  };

  const handleTagsChange = (tags: string[]) => {
    setTags(tags);
  };

  const handleClear = () => {
    clearFilter();
  };

  const currentSortValue = `${sortField}-${sortDirection}`;
  const isFilterActive = hasActiveFilters();

  return (
    <Box padding={2}>
      <Flex gap={4} alignItems="center" wrap>
        {/* Sort */}
        {showSort && (
          <Box width={200}>
            <SelectList
              id="pin-sort"
              label="Sort by"
              value={currentSortValue}
              onChange={handleSortChange}
              size="lg"
            >
              {PIN_SORT_OPTIONS.map((option) => (
                <SelectList.Option
                  key={`${option.field}-${option.direction}`}
                  label={option.label}
                  value={`${option.field}-${option.direction}`}
                />
              ))}
            </SelectList>
          </Box>
        )}

        {/* Tags Filter */}
        {showTags && (
          <Box flex="grow" maxWidth={400}>
            <PinTagFilter
              selectedTags={filter.tags || []}
              onChange={handleTagsChange}
            />
          </Box>
        )}

        {/* Clear Filters */}
        {showClear && isFilterActive && (
          <Tooltip text="Clear all filters">
            <Button
              text="Clear filters"
              onClick={handleClear}
              size="lg"
              color="gray"
              iconEnd="cancel"
            />
          </Tooltip>
        )}
      </Flex>
    </Box>
  );
};

export default PinFilters;