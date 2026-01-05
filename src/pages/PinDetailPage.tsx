// src/pages/PinDetailPage.tsx

import React, { useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Box, Flex, Spinner, IconButton } from 'gestalt';
import { 
  PinDetailImage,
  PinDetailContent,
  PinGrid,
  usePin, 
  useRelatedPins,
} from '@/modules/pin';
import { ErrorMessage } from '@/shared/components';
import { ROUTES } from '@/app/router/routeConfig';

const PinDetailPage: React.FC = () => {
  const { pinId } = useParams<{ pinId: string }>();
  const navigate = useNavigate();

  const { pin, isLoading, isError, error, refetch } = usePin(pinId);

  const {
    pins: relatedPins,
    isLoading: isLoadingRelated,
    isFetchingNextPage: isFetchingMoreRelated,
    hasNextPage: hasMoreRelated,
    fetchNextPage: fetchMoreRelated,
  } = useRelatedPins(pinId, { enabled: !!pin });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pinId]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    void refetch();
  };

  const handleFetchMoreRelated = () => {
    fetchMoreRelated();
  };

  if (!pinId) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <Spinner accessibilityLabel="Loading pin" show size="lg" />
      </Box>
    );
  }

  if (isError || !pin) {
    return (
      <Box paddingY={8}>
        <ErrorMessage
          title="Failed to load pin"
          message={error?.message || 'Pin not found'}
          onRetry={handleRetry}
        />
      </Box>
    );
  }

  return (
    <Box paddingY={6}>
      {/* Close/Back Button - Fixed position */}
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
      <Box
        maxWidth={1016}
        marginStart="auto"
        marginEnd="auto"
        rounding={5}
        overflow="hidden"
        color="default"
        dangerouslySetInlineStyle={{
          __style: {
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Flex wrap>
          {/* Left Side - Image */}
          <Box
            minWidth={300}
            maxWidth={508}
            flex="grow"
            dangerouslySetInlineStyle={{
              __style: {
                flex: '1 1 50%',
              },
            }}
          >
            <PinDetailImage pin={pin} />
          </Box>

          {/* Right Side - Content */}
          <Box
            minWidth={300}
            flex="grow"
            dangerouslySetInlineStyle={{
              __style: {
                flex: '1 1 50%',
                maxHeight: '90vh',
                overflowY: 'auto',
              },
            }}
          >
            <PinDetailContent pin={pin} />
          </Box>
        </Flex>
      </Box>

      {/* Related Pins Section */}
      <Box marginTop={8}>
        <Box 
          marginBottom={4}
          display="flex"
          justifyContent="center"
        >
          <Box
            dangerouslySetInlineStyle={{
              __style: {
                fontSize: 20,
                fontWeight: 600,
              },
            }}
          >
            More like this
          </Box>
        </Box>

        <PinGrid
          pins={relatedPins}
          isLoading={isLoadingRelated}
          isFetchingNextPage={isFetchingMoreRelated}
          hasNextPage={hasMoreRelated}
          fetchNextPage={handleFetchMoreRelated}
          emptyMessage="No related pins found"
        />
      </Box>
    </Box>
  );
};

export default PinDetailPage;