// src/modules/pin/components/detail/PinDetail.tsx

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Spinner, Heading, IconButton } from 'gestalt';
import { PinDetailCard } from './PinDetailCard';
import { PinGrid } from '../PinGrid';
import { usePin } from '../../hooks/usePin';
import { useRelatedPins } from '../../hooks/usePins';
import { ErrorMessage } from '@/shared/components';
import { ROUTES } from '@/app/router/routeConfig';

interface PinDetailProps {
  pinId: string;
}

export const PinDetail: React.FC<PinDetailProps> = ({ pinId }) => {
  const navigate = useNavigate();

  const { pin, isLoading, isError, error, refetch } = usePin(pinId);

  const {
    pins: relatedPins,
    isLoading: isLoadingRelated,
    isFetchingNextPage: isFetchingMoreRelated,
    hasNextPage: hasMoreRelated,
    fetchNextPage: fetchMoreRelated,
  } = useRelatedPins(pinId, { enabled: !!pin });

  // Scroll to top when pin changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pinId]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleFetchMoreRelated = useCallback(() => {
    fetchMoreRelated();
  }, [fetchMoreRelated]);

  const handleGoHome = useCallback(() => {
    navigate(ROUTES.HOME);
  }, [navigate]);

  // Loading state
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Spinner accessibilityLabel="Loading pin" show size="lg" />
      </Box>
    );
  }

  // Error state
  if (isError || !pin) {
    return (
      <Box paddingY={8}>
        <ErrorMessage
          title="Pin not found"
          message={error?.message || "This pin doesn't exist or has been deleted"}
          onRetry={handleRetry}
        />
      </Box>
    );
  }

  return (
    <Box paddingY={6}>
      {/* Floating Back Button */}
      <Box
        position="fixed"
        dangerouslySetInlineStyle={{
          __style: {
            top: 'calc(var(--header-height) + 16px)',
            left: 16,
            zIndex: 10,
          },
        }}
      >
        <IconButton
          accessibilityLabel="Go back"
          icon="arrow-back"
          onClick={handleGoBack}
          size="lg"
          bgColor="white"
          iconColor="darkGray"
        />
      </Box>

      {/* Main Pin Card */}
      <PinDetailCard pin={pin} onBack={handleGoBack} />

      {/* Related Pins Section */}
      <Box marginTop={10}>
        <Box marginBottom={4} paddingX={4}>
          <Heading size="400" align="center">
            More like this
          </Heading>
        </Box>

        <PinGrid
          pins={relatedPins}
          isLoading={isLoadingRelated}
          isFetchingNextPage={isFetchingMoreRelated}
          hasNextPage={hasMoreRelated}
          fetchNextPage={handleFetchMoreRelated}
          emptyMessage="No related pins found"
          emptyAction={{
            text: 'Explore more',
            onClick: handleGoHome,
          }}
        />
      </Box>
    </Box>
  );
};

export default PinDetail;