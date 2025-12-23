// src/pages/HomePage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Flex, 
  IconButton, 
  Tooltip, 
  Text, 
  Button, 
} from 'gestalt';
import { 
  PinGrid, 
  PinFilters, 
  PinSearchBar,
  useInfinitePins, 
  usePinFiltersStore,
} from '@/modules/pin';
import { useAuth } from '@/modules/auth';
import { CategoryGrid } from '@/modules/tag';
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
              bgColor={hasActiveFilters() ? 'red' : 'gray'}
              iconColor={hasActiveFilters() ? 'white' : 'darkGray'}
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
          <Box 
            padding={4} 
            color="secondary" 
            rounding={4}
          >
            <PinFilters showSort showTags showClear />
          </Box>
        </Box>
      )}

      {/* Categories for Non-Authenticated Users */}
      {!isAuthenticated && pins.length === 0 && !isLoading && (
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
            hasActiveFilters() 
              ? 'No pins match your filters' 
              : 'No pins to show yet'
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