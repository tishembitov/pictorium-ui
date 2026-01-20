// src/modules/explore/components/ExploreCategoryBar.tsx

import React, { useRef, useState, useCallback } from 'react';
import { Box, IconButton, TapArea, Text } from 'gestalt';
import { useImageUrl } from '@/modules/storage';
import { getCategoryEmoji } from '../types/explore.types';
import type { CategoryResponse } from '@/modules/tag';

interface ExploreCategoryBarProps {
  categories: CategoryResponse[];
  selectedCategory?: string;
  onCategorySelect: (categoryName: string) => void;
  isLoading?: boolean;
}

// Individual category item
const CategoryItem: React.FC<{
  category: CategoryResponse;
  isSelected: boolean;
  onClick: () => void;
}> = ({ category, isSelected, onClick }) => {
  const imageId = category.pin?.thumbnailId || category.pin?.imageId;
  const { data: imageData } = useImageUrl(imageId, { enabled: !!imageId });
  const emoji = getCategoryEmoji(category.tagName);

  return (
    <TapArea onTap={onClick} rounding={4}>
      <Box
        display="flex"
        direction="column"
        alignItems="center"
        paddingX={3}
        paddingY={2}
      >
        {/* Circle with image or emoji */}
        <Box
          width={64}
          height={64}
          rounding="circle"
          overflow="hidden"
          marginBottom={2}
          dangerouslySetInlineStyle={{
            __style: {
              border: isSelected ? '3px solid #e60023' : '3px solid transparent',
              transition: 'all 0.2s ease',
              transform: isSelected ? 'scale(1.05)' : 'scale(1)',
            },
          }}
        >
          {imageData?.url ? (
            <img
              src={imageData.url}
              alt={category.tagName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box
              width="100%"
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="secondary"
            >
              <span style={{ fontSize: 28 }}>{emoji}</span>
            </Box>
          )}
        </Box>
        
        {/* Label */}
        <Text
          size="100"
          weight={isSelected ? 'bold' : 'normal'}
          align="center"
          lineClamp={1}
        >
          {category.tagName}
        </Text>
      </Box>
    </TapArea>
  );
};

// Skeleton item
const CategorySkeleton: React.FC<{ id: string }> = ({ id }) => (
  <Box
    key={id}
    display="flex"
    direction="column"
    alignItems="center"
    paddingX={3}
    paddingY={2}
  >
    <Box
      width={64}
      height={64}
      rounding="circle"
      color="secondary"
      marginBottom={2}
      dangerouslySetInlineStyle={{
        __style: { animation: 'pulse 1.5s ease-in-out infinite' },
      }}
    />
    <Box
      width={48}
      height={12}
      rounding={2}
      color="secondary"
      dangerouslySetInlineStyle={{
        __style: { animation: 'pulse 1.5s ease-in-out infinite' },
      }}
    />
  </Box>
);

const SKELETON_IDS = ['skel-1', 'skel-2', 'skel-3', 'skel-4', 'skel-5', 'skel-6', 'skel-7', 'skel-8'];

export const ExploreCategoryBar: React.FC<ExploreCategoryBarProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  isLoading = false,
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
    
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  if (isLoading) {
    return (
      <Box position="relative">
        <Box
          display="flex"
          overflow="hidden"
          dangerouslySetInlineStyle={{
            __style: { gap: '8px' },
          }}
        >
          {SKELETON_IDS.map((id) => (
            <CategorySkeleton key={id} id={id} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      position="relative" 
      marginTop={4}
      marginBottom={4}
    >
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
              zIndex: 1,
              background: 'linear-gradient(to right, var(--bg-default) 60%, transparent)',
              paddingRight: 16,
            },
          }}
        >
          <IconButton
            accessibilityLabel="Scroll left"
            icon="arrow-back"
            onClick={() => scroll('left')}
            size="md"
            bgColor="white"
          />
        </Box>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="explore-category-bar__scroll"
      >
        {categories.map((category) => (
          <CategoryItem
            key={category.tagId}
            category={category}
            isSelected={selectedCategory === category.tagName}
            onClick={() => onCategorySelect(category.tagName)}
          />
        ))}
      </div>

      {/* Right Arrow */}
      {showRightArrow && categories.length > 6 && (
        <Box
          position="absolute"
          right
          top
          bottom
          display="flex"
          alignItems="center"
          dangerouslySetInlineStyle={{
            __style: {
              zIndex: 1,
              background: 'linear-gradient(to left, var(--bg-default) 60%, transparent)',
              paddingLeft: 16,
            },
          }}
        >
          <IconButton
            accessibilityLabel="Scroll right"
            icon="arrow-forward"
            onClick={() => scroll('right')}
            size="md"
            bgColor="white"
          />
        </Box>
      )}
    </Box>
  );
};

export default ExploreCategoryBar;