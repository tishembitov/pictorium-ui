// src/pages/HomePage.tsx

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from 'gestalt';
import { PinGrid, usePins } from '@/modules/pin';
import { EmptyState } from '@/shared/components';
import { ROUTES } from '@/app/router/routes';

/**
 * HomePage - Pinterest-style minimal home page
 * Only shows the pin grid, all search/filters handled in Header
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Fetch pins for home feed
  const {
    pins,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = usePins({});

  const handleFetchNextPage = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleExplore = useCallback(() => {
    navigate(ROUTES.EXPLORE);
  }, [navigate]);

  // Error state
  if (isError) {
    return (
      <Box paddingY={8}>
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
    );
  }

  return (
    <Box paddingY={2}>
      <PinGrid
        pins={pins}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={handleFetchNextPage}
        emptyMessage="No pins to show yet"
        emptyAction={{ text: 'Explore', onClick: handleExplore }}
      />
    </Box>
  );
};

export default HomePage;