// src/modules/tag/components/CategoryCard.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, TapArea, Mask, Image as GestaltImage } from 'gestalt';
import { useImageUrl } from '@/modules/storage';
import type { CategoryResponse } from '../types/category.types';

interface CategoryCardProps {
  category: CategoryResponse;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (category: CategoryResponse) => void;
}

const sizeConfig = {
  sm: { width: 120, height: 120, textSize: '200' as const },
  md: { width: 180, height: 180, textSize: '300' as const },
  lg: { width: 236, height: 236, textSize: '400' as const },
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  size = 'md',
  onClick,
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const config = sizeConfig[size];

  // Get image URL for the category's representative pin
  const imageId = category.pin?.thumbnailId || category.pin?.imageId;
  const { data: imageData } = useImageUrl(imageId, {
    enabled: !!imageId,
  });

  const handleClick = () => {
    if (onClick) {
      onClick(category);
    } else {
      navigate(`/search?q=${encodeURIComponent(category.tagName)}`);
    }
  };

  return (
    <TapArea onTap={handleClick} rounding={4}>
      <Box
        position="relative"
        width={config.width}
        height={config.height}
        rounding={4}
        overflow="hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            transition: 'transform 0.2s ease',
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          },
        }}
      >
        {/* Background Image */}
        {imageData?.url ? (
          <Mask rounding={4}>
            <GestaltImage
              src={imageData.url}
              alt={category.tagName}
              naturalWidth={1}
              naturalHeight={1}
              fit="cover"
            />
          </Mask>
        ) : (
          <Box
            width="100%"
            height="100%"
            color="secondary"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="subtle" size="400">
              {category.tagName.charAt(0).toUpperCase()}
            </Text>
          </Box>
        )}

        {/* Overlay */}
        <Box
          position="absolute"
          top
          left
          right
          bottom
          display="flex"
          alignItems="center"
          justifyContent="center"
          dangerouslySetInlineStyle={{
            __style: {
              background: isHovered 
                ? 'rgba(0, 0, 0, 0.5)' 
                : 'rgba(0, 0, 0, 0.3)',
              transition: 'background 0.2s ease',
            },
          }}
        >
          <Text
            color="inverse"
            weight="bold"
            size={config.textSize}
            align="center"
          >
            {category.tagName}
          </Text>
        </Box>
      </Box>
    </TapArea>
  );
};

export default CategoryCard;