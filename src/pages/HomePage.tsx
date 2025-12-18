import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Heading, Flex, Divider, IconButton, Tooltip, Text} from 'gestalt';
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
import { ROUTES } from '@/app/router/routeConfig';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  
  const [showFilters, setShowFilters] = useState(false);
  
  const filter = usePinFiltersStore((state) => state.filter);
  const hasActiveFilters = usePinFiltersStore((state) => state.hasActiveFilters);
  const clearFilter = usePinFiltersStore((state) => state.clearFilter);
  
  const { selectedBoard, hasSelectedBoard } = useSelectedBoard();

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
    // === Минимальные отступы ===
    <Box paddingY={2}>
      {/* Header Section - компактный */}
      <Flex 
        direction={isMobile ? 'column' : 'row'} 
        justifyContent="between" 
        alignItems={isMobile ? 'start' : 'center'}
        gap={2}
      >
        <Box>
          <Heading size="300" accessibilityLevel={1}>
            {isAuthenticated ? 'Home Feed' : 'Discover'}
          </Heading>
          {totalElements > 0 && (
            <Text size="100" color="subtle">
              {totalElements.toLocaleString()} pins
            </Text>
          )}
        </Box>

        {/* Action Buttons - компактные */}
        <Flex gap={1} alignItems="center">
          {/* Search Bar */}
          <Box width={isMobile ? '100%' : 240}>
            <PinSearchBar 
              placeholder="Search..." 
              navigateOnSearch 
            />
          </Box>

          {/* Filter Toggle */}
          <Tooltip text={showFilters ? 'Hide filters' : 'Filters'}>
            <IconButton
              accessibilityLabel="Toggle filters"
              icon="filter"
              onClick={toggleFilters}
              size="sm"
              bgColor={hasActiveFilters() ? 'red' : 'transparent'}
              iconColor={hasActiveFilters() ? 'white' : 'darkGray'}
            />
          </Tooltip>

          {/* Board Picker */}
          {isAuthenticated && (
            <BoardPicker size="sm" />
          )}

          {/* Create Pin */}
          {isAuthenticated && (
            <Tooltip text="Create">
              <IconButton
                accessibilityLabel="Create pin"
                icon="add"
                onClick={handleCreatePin}
                size="sm"
                bgColor="red"
                iconColor="white"
              />
            </Tooltip>
          )}
        </Flex>
      </Flex>

      {/* Selected Board Indicator - компактный */}
      {hasSelectedBoard && selectedBoard && (
        <Box marginTop={2} padding={2} color="secondary" rounding={2}>
          <Text size="100" weight="bold">
            Saving to: {selectedBoard.title}
          </Text>
        </Box>
      )}

      {/* Filters Section */}
      {showFilters && (
        <Box marginTop={2}>
          <PinFilters showSort showTags showClear />
          <Divider />
        </Box>
      )}

      {/* Categories for Non-Authenticated Users */}
      {!isAuthenticated && pins.length === 0 && !isLoading && (
        <Box marginTop={3} marginBottom={3}>
          <CategoryGrid 
            limit={6} 
            size="sm" 
            title="Popular Categories"
            showTitle
          />
          <Divider />
        </Box>
      )}

      {/* Error State */}
      {isError && (
        <Box marginTop={4}>
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

      {/* Pins Grid - минимальные отступы */}
      <Box marginTop={2}>
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