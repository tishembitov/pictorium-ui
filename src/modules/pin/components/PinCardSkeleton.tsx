// src/modules/pin/components/PinCardSkeleton.tsx

import React, { useMemo } from 'react';
import { Box } from 'gestalt';

interface PinCardSkeletonProps {
  height?: number;
  index?: number; // Use index for deterministic height
}

export const PinCardSkeleton: React.FC<PinCardSkeletonProps> = ({
  height = 250,
  index = 0,
}) => {
  // Generate deterministic height based on index for masonry effect
  const skeletonHeight = useMemo(() => {
    // Use a simple hash based on index to get consistent heights
    const heightVariants = [0, 30, 60, 90, 45, 75, 15, 50];
    const variantIndex = index % heightVariants.length;
    return height + (heightVariants[variantIndex] ?? 0);
  }, [height, index]);

  return (
    <Box rounding={4} overflow="hidden">
      {/* Image skeleton */}
      <Box
        color="secondary"
        height={skeletonHeight}
        rounding={4}
        dangerouslySetInlineStyle={{
          __style: {
            animation: 'pulse 1.5s ease-in-out infinite',
          },
        }}
      />
      
      {/* Title skeleton */}
      <Box paddingX={1} paddingY={2}>
        <Box
          color="secondary"
          height={16}
          width="80%"
          rounding={2}
          dangerouslySetInlineStyle={{
            __style: {
              animation: 'pulse 1.5s ease-in-out infinite',
            },
          }}
        />
      </Box>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Box>
  );
};

export default PinCardSkeleton;