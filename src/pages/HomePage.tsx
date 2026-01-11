import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Flex, 
  IconButton, 
  Tooltip, 
  Text, 
  Button,
  SearchField,
} from 'gestalt';
import { 
  PinGrid, 
  usePins,
  PinSortSelect,
} from '@/modules/pin';
import { usePinPreferencesStore } from '@/modules/pin/stores/pinPreferencesStore';
import type { PinFilter } from '@/modules/pin';
import { TagInput , CategoryGrid } from '@/modules/tag';
import { useAuth } from '@/modules/auth';
import { EmptyState } from '@/shared/components';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { ROUTES } from '@/app/router/routes';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  
  // Local filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Debounced search
  const debouncedSearch = useDebounce(searchInput, 300);
  
  // Global sort preference
  const sort = usePinPreferencesStore((s) => s.sort);

  // Build filter from local state
  const filter = useMemo((): PinFilter => ({
    q: debouncedSearch || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  }), [debouncedSearch, selectedTags]);

  // Check if any filters are active
  const hasFilters = !!(debouncedSearch || selectedTags.length > 0);

  // Fetch pins
  const {
    pins,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = usePins(filter, { sort });

  // Handlers
  const handleCreatePin = useCallback(() => {
    navigate(ROUTES.PIN_CREATE);
  }, [navigate]);

  const handleExplore = useCallback(() => {
    navigate(ROUTES.EXPLORE);
  }, [navigate]);

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    setSelectedTags([]);
  }, []);

  const handleSearchChange = useCallback(({ value }: { value: string }) => {
    setSearchInput(value);
  }, []);

  const handleSearchKeyDown = useCallback(({ event }: { event: React.KeyboardEvent<HTMLInputElement> }) => {
    if (event.key === 'Enter' && searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  }, [searchInput, navigate]);

  return (
    <Box paddingY={4}>
      {/* Header Section */}
      <Flex 
        direction={isMobile ? 'column' : 'row'} 
        justifyContent="between" 
        alignItems={isMobile ? 'start' : 'center'}
        gap={3}
      >
        <Box>
          <Heading size="400" accessibilityLevel={1}>
            {isAuthenticated ? 'Home Feed' : 'Discover Ideas'}
          </Heading>
          {totalElements > 0 && (
            <Box marginTop={1}>
              <Text size="200" color="subtle">
                {totalElements.toLocaleString()} pins to explore
              </Text>
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        <Flex gap={3} alignItems="center" wrap>
          {/* Search Bar */}
          <Box width={isMobile ? '100%' : 280}>
            <SearchField
              id="home-search"
              accessibilityLabel="Search pins"
              accessibilityClearButtonLabel="Clear"
              placeholder="Search pins..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
          </Box>

          {/* Filter Toggle */}
          <Tooltip text={showFilters ? 'Hide filters' : 'Show filters'}>
            <IconButton
              accessibilityLabel="Toggle filters"
              icon="filter"
              onClick={toggleFilters}
              size="md"
              bgColor={hasFilters ? 'red' : 'gray'}
              iconColor={hasFilters ? 'white' : 'darkGray'}
            />
          </Tooltip>

          {/* Create Pin */}
          {isAuthenticated && (
            <Button
              text="Create"
              onClick={handleCreatePin}
              color="red"
              size="lg"
              iconEnd="add"
            />
          )}
        </Flex>
      </Flex>

      {/* Filters Section */}
      {showFilters && (
        <Box marginTop={4} marginBottom={4}>
          <Box padding={4} color="secondary" rounding={4}>
            <Flex gap={4} alignItems="end" wrap>
              {/* Sort */}
              <PinSortSelect />
              
              {/* Tags */}
              <Box flex="grow" maxWidth={400}>
                <TagInput
                  id="home-tags"
                  label="Filter by tags"
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  placeholder="Add tags..."
                  maxTags={5}
                />
              </Box>

              {/* Clear */}
              {hasFilters && (
                <Button
                  text="Clear filters"
                  onClick={handleClearFilters}
                  size="lg"
                  color="gray"
                />
              )}
            </Flex>
          </Box>
        </Box>
      )}

      {/* Categories for Non-Authenticated Users */}
      {!isAuthenticated && pins.length === 0 && !isLoading && !hasFilters && (
        <Box marginTop={6} marginBottom={6}>
          <CategoryGrid 
            limit={8} 
            size="md" 
            title="Popular Categories"
            showTitle
          />
        </Box>
      )}

      {/* Error State */}
      {isError && (
        <Box marginTop={6}>
          <EmptyState
            title="Something went wrong"
            description="We couldn't load the pins. Please try again."
            icon="workflow-status-problem"
            action={{
              text: 'Try again',
              onClick: handleRetry,
            }}
          />
        </Box>
      )}

      {/* Pins Grid */}
      <Box marginTop={4}>
        <PinGrid
          pins={pins}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={handleFetchNextPage}
          emptyMessage={
            hasFilters 
              ? 'No pins match your filters' 
              : 'No pins to show yet'
          }
          emptyAction={
            hasFilters
              ? { text: 'Clear filters', onClick: handleClearFilters }
              : { text: 'Explore', onClick: handleExplore }
          }
        />
      </Box>
    </Box>
  );
};

export default HomePage;