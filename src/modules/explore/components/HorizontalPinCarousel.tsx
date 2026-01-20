// src/modules/explore/components/HorizontalPinCarousel.tsx

import React, { useRef, useState, useCallback } from 'react';
import { Box, IconButton } from 'gestalt';
import { PinCard, PinCardSkeleton } from '@/modules/pin';
import type { PinResponse } from '@/modules/pin';

interface HorizontalPinCarouselProps {
  pins: PinResponse[];
  isLoading?: boolean;
  skeletonCount?: number;
}

const SKELETON_IDS = ['carousel-skel-1', 'carousel-skel-2', 'carousel-skel-3', 'carousel-skel-4', 'carousel-skel-5', 'carousel-skel-6'];

export const HorizontalPinCarousel: React.FC<HorizontalPinCarouselProps> = ({
  pins,
  isLoading = false,
  skeletonCount = 6,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = 260; // ~1 card width + gap
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  if (isLoading) {
    return (
      <Box overflow="hidden">
        <div className="explore-carousel__scroll">
          {SKELETON_IDS.slice(0, skeletonCount).map((id, index) => (
            <Box key={id} minWidth={236}>
              <PinCardSkeleton index={index} />
            </Box>
          ))}
        </div>
      </Box>
    );
  }

  if (pins.length === 0) {
    return null;
  }

  return (
    <Box position="relative">
      {/* Left Arrow */}
      {showLeftArrow && (
        <Box
          position="absolute"
          left
          top
          bottom
          display="flex"
          alignItems="center"
          dangerouslySetInlineStyle={{
            __style: {
              zIndex: 2,
              background: 'linear-gradient(to right, var(--bg-default) 40%, transparent)',
              paddingRight: 24,
            },
          }}
        >
          <IconButton
            accessibilityLabel="Scroll left"
            icon="arrow-back"
            onClick={() => scroll('left')}
            size="lg"
            bgColor="white"
          />
        </Box>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="explore-carousel__scroll"
      >
        {pins.map((pin) => (
          <Box
            key={pin.id}
            minWidth={236}
            maxWidth={236}
          >
            <PinCard
              pin={pin}
              showActions={true}
            />
          </Box>
        ))}
      </div>

      {/* Right Arrow */}
      {showRightArrow && pins.length > 4 && (
        <Box
          position="absolute"
          right
          top
          bottom
          display="flex"
          alignItems="center"
          dangerouslySetInlineStyle={{
            __style: {
              zIndex: 2,
              background: 'linear-gradient(to left, var(--bg-default) 40%, transparent)',
              paddingLeft: 24,
            },
          }}
        >
          <IconButton
            accessibilityLabel="Scroll right"
            icon="arrow-forward"
            onClick={() => scroll('right')}
            size="lg"
            bgColor="white"
          />
        </Box>
      )}
    </Box>
  );
};

export default HorizontalPinCarousel;