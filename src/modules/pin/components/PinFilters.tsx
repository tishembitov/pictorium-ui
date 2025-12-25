// src/modules/pin/components/PinFilters.tsx

import React, { useMemo, useCallback } from 'react';
import { 
  Box, 
  Flex, 
  Button, 
  SelectList, 
  Tooltip,
  IconButton,
  Badge,
} from 'gestalt';
import { PinTagFilter } from './PinTagFilter';
import { PinScopeFilter } from './PinScopeFilter';
import { 
  usePinFiltersStore, 
  selectFilter, 
  selectSortField, 
  selectSortDirection, 
  selectIsFilterPanelOpen 
} from '../stores/pinFiltersStore';
import { hasActiveFilters, countActiveFilters } from '../utils/pinFilterUtils';
import { PIN_SORT_OPTIONS } from '../types/pinFilter.types';

interface PinFiltersProps {
  showScope?: boolean;
  showSort?: boolean;
  showTags?: boolean;
  showClear?: boolean;
  context?: 'home' | 'profile' | 'user';
  isOwnProfile?: boolean;
  userId?: string;
  compact?: boolean;
}

export const PinFilters: React.FC<PinFiltersProps> = ({
  showScope = true,
  showSort = true,
  showTags = true,
  showClear = true,
  context = 'home',
  isOwnProfile = false,
  userId,
  compact = false,
}) => {
  // Use individual selectors for stability
  const filter = usePinFiltersStore(selectFilter);
  const sortField = usePinFiltersStore(selectSortField);
  const sortDirection = usePinFiltersStore(selectSortDirection);
  const isFilterPanelOpen = usePinFiltersStore(selectIsFilterPanelOpen);
  
  // Get actions directly (these are stable)
  const setSort = usePinFiltersStore((state) => state.setSort);
  const setTags = usePinFiltersStore((state) => state.setTags);
  const clearFilter = usePinFiltersStore((state) => state.clearFilter);
  const toggleFilterPanel = usePinFiltersStore((state) => state.toggleFilterPanel);

  // Memoize computed values
  const isFilterActive = useMemo(() => hasActiveFilters(filter), [filter]);
  const filterCount = useMemo(() => countActiveFilters(filter), [filter]);
  const currentSortValue = `${sortField}-${sortDirection}`;

  const handleSortChange = useCallback(({ value }: { value: string }) => {
    const option = PIN_SORT_OPTIONS.find(
      (opt) => `${opt.field}-${opt.direction}` === value
    );
    if (option) {
      setSort(option.field, option.direction);
    }
  }, [setSort]);

  const handleTagsChange = useCallback((tags: string[]) => {
    setTags(tags);
  }, [setTags]);

  const handleClear = useCallback(() => {
    clearFilter();
  }, [clearFilter]);

  const handleToggleFilterPanel = useCallback(() => {
    toggleFilterPanel();
  }, [toggleFilterPanel]);

  // Compact mode
  if (compact) {
    // Определяем bgColor для IconButton
    const filterButtonBgColor = isFilterPanelOpen ? 'gray' : 'transparent';

    return (
      <Box padding={2}>
        <Flex gap={2} alignItems="center">
          {showScope && (
            <PinScopeFilter
              context={context}
              isOwnProfile={isOwnProfile}
              userId={userId}
              size="sm"
              showLabel={false}
            />
          )}

          <Box position="relative">
            <IconButton
              accessibilityLabel="Toggle filters"
              icon="filter"
              onClick={handleToggleFilterPanel}
              size="sm"
              bgColor={filterButtonBgColor}
            />
            {filterCount > 0 && (
              <Box position="absolute" top marginTop={-1} right marginEnd={-1}>
                <Badge text={String(filterCount)} type="error" />
              </Box>
            )}
          </Box>

          {showClear && isFilterActive && (
            <IconButton
              accessibilityLabel="Clear filters"
              icon="cancel"
              onClick={handleClear}
              size="sm"
            />
          )}
        </Flex>
      </Box>
    );
  }

  return (
    <Box padding={2}>
      <Flex gap={4} alignItems="center" wrap>
        {showScope && (
          <PinScopeFilter
            context={context}
            isOwnProfile={isOwnProfile}
            userId={userId}
            size="md"
          />
        )}

        {showSort && (
          <Box width={180}>
            <SelectList
              id="pin-sort"
              label="Sort by"
              labelDisplay="hidden"
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

        {showTags && (
          <Box flex="grow" maxWidth={400}>
            <PinTagFilter
              selectedTags={filter.tags || []}
              onChange={handleTagsChange}
            />
          </Box>
        )}

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