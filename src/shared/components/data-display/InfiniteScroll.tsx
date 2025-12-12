// src/shared/components/data-display/InfiniteScroll.tsx
import React, { type ReactNode } from 'react';
import { Box, Spinner } from 'gestalt';
import { useInfiniteScroll } from '../../hooks/useIntersectionObserver';

interface InfiniteScrollProps {
  children: ReactNode;
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  loader?: ReactNode;
  endMessage?: ReactNode;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  loadMore,
  hasMore,
  isLoading,
  threshold = 100,
  loader,
  endMessage,
}) => {
  const sentinelRef = useInfiniteScroll(loadMore, {
    hasMore,
    isLoading,
    rootMargin: `${threshold}px`,
  });

  return (
    <Box width="100%">
      {children}
      
      {/* Sentinel element for intersection observer */}
      <Box ref={sentinelRef} height={1} />
      
      {/* Loading indicator */}
      {isLoading && (
        <Box display="flex" justifyContent="center" padding={6}>
          {loader || (
            <Spinner accessibilityLabel="Loading more..." show />
          )}
        </Box>
      )}
      
      {/* End message */}
      {!hasMore && !isLoading && endMessage && (
        <Box display="flex" justifyContent="center" padding={6}>
          {endMessage}
        </Box>
      )}
    </Box>
  );
};

export default InfiniteScroll;