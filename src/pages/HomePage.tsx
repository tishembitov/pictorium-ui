// ================================================
// FILE: src/pages/HomePage.tsx
// ================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, Flex, Divider, IconButton, Tooltip } from 'gestalt';
import { 
  PinGrid, 
  PinFilters, 
  PinSearchBar,
  useInfinitePins, 
  usePinFiltersStore,
} from '@/modules/pin';
import { BoardPicker, useSelectedBoard } from '@/modules/board';
import { CategoryGrid } from '@/modules/tag';
import { useAuth } from '@/modules/auth';
import { EmptyState } from '@/shared/components';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { ROUTES } from '@/shared/utils/constants';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters from store
  const filter = usePinFiltersStore((state) => state.filter);
  const hasActiveFilters = usePinFiltersStore((state) => state.hasActiveFilters);
  const clearFilter = usePinFiltersStore((state) => state.clearFilter);
  
  // Selected board
  const { selectedBoard, hasSelectedBoard } = useSelectedBoard();

  // Pins query
  const {
    pins,
    totalElements,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfinitePins(filter);

  const handleCreatePin = () => {
    navigate(ROUTES.PIN_CREATE);
  };

  const handleExplore = () => {
    navigate(ROUTES.EXPLORE);
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const handleFetchNextPage = () => {
    void fetchNextPage();
  };

  const handleRetry = () => {
    void refetch();
  };

  return (
    <Box paddingY={4}>
      {/* Header Section */}
      <Flex 
        direction={isMobile ? 'column' : 'row'} 
        justifyContent="between" 
        alignItems={isMobile ? 'start' : 'center'}
        gap={4}
      >
        <Box>
          <Heading size="400" accessibilityLevel={1}>
            {isAuthenticated ? 'Your Home Feed' : 'Discover Ideas'}
          </Heading>
          {totalElements > 0 && (
            <Box marginTop={1}>
              <Heading size="200" color="subtle" accessibilityLevel={2}>
                {totalElements.toLocaleString()} pins
              </Heading>
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        <Flex gap={2} alignItems="center">
          {/* Search Bar */}
          <Box width={isMobile ? '100%' : 300}>
            <PinSearchBar 
              placeholder="Search pins..." 
              navigateOnSearch 
            />
          </Box>

          {/* Filter Toggle */}
          <Tooltip text={showFilters ? 'Hide filters' : 'Show filters'}>
            <IconButton
              accessibilityLabel="Toggle filters"
              icon="filter"
              onClick={toggleFilters}
              size="md"
              bgColor={hasActiveFilters() ? 'red' : 'transparent'}
              iconColor={hasActiveFilters() ? 'white' : 'darkGray'}
            />
          </Tooltip>

          {/* Board Picker */}
          {isAuthenticated && (
            <BoardPicker size="md" />
          )}

          {/* Create Pin */}
          {isAuthenticated && (
            <Tooltip text="Create pin">
              <IconButton
                accessibilityLabel="Create pin"
                icon="add"
                onClick={handleCreatePin}
                size="md"
                bgColor="red"
                iconColor="white"
              />
            </Tooltip>
          )}
        </Flex>
      </Flex>

      {/* Selected Board Indicator */}
      {hasSelectedBoard && selectedBoard && (
        <Box marginTop={3} padding={3} color="secondary" rounding={2}>
          <Flex alignItems="center" justifyContent="between">
            <Heading size="200" accessibilityLevel={3}>
              Saving to: {selectedBoard.title}
            </Heading>
          </Flex>
        </Box>
      )}

      {/* Filters Section */}
      {showFilters && (
        <Box marginTop={4}>
          <PinFilters showSort showTags showClear />
          <Divider />
        </Box>
      )}

      {/* Categories for Non-Authenticated Users */}
      {!isAuthenticated && pins.length === 0 && !isLoading && (
        <Box marginTop={6} marginBottom={6}>
          <CategoryGrid 
            limit={6} 
            size="md" 
            title="Popular Categories"
            showTitle
          />
          <Divider />
        </Box>
      )}

      {/* Error State */}
      {isError && (
        <Box marginTop={6}>
          <EmptyState
            title="Failed to load pins"
            description="Something went wrong. Please try again."
            icon="workflow-status-problem"
            action={{
              text: 'Retry',
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
            hasActiveFilters() 
              ? 'No pins match your filters' 
              : 'No pins to show. Start exploring!'
          }
          emptyAction={
            hasActiveFilters()
              ? { text: 'Clear filters', onClick: clearFilter }
              : { text: 'Explore', onClick: handleExplore }
          }
        />
      </Box>
    </Box>
  );
};

export default HomePage;