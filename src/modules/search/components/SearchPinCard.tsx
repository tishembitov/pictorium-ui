// src/modules/search/components/SearchPinCard.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Mask, TapArea, Text, Image as GestaltImage } from 'gestalt';
import { buildPath } from '@/app/router/routes';
import { useImageUrl } from '@/modules/storage';
import { getHighlightedText } from '../utils/searchUtils';
import type { PinSearchResult } from '../types/search.types';

interface SearchPinCardProps {
  pin: PinSearchResult;
  showHighlights?: boolean;
}

export const SearchPinCard: React.FC<SearchPinCardProps> = ({
  pin,
  showHighlights = true,
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const imageId = pin.thumbnailId || pin.imageId;
  const { data: imageData } = useImageUrl(imageId, { enabled: !!imageId });

  const handleClick = useCallback(() => {
    navigate(buildPath.pin(pin.id));
  }, [navigate, pin.id]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleImageLoad = useCallback(() => setIsLoaded(true), []);

  // Get highlighted title or fallback
  const displayTitle = useMemo(() => {
    if (showHighlights && pin.highlights) {
      return getHighlightedText(pin.highlights, 'title', pin.title);
    }
    return pin.title || '';
  }, [pin.highlights, pin.title, showHighlights]);

  const dimensions = useMemo(() => ({
    width: 236,
    height: Math.min(400, Math.max(200, (pin.originalHeight / pin.originalWidth) * 236)),
  }), [pin.originalWidth, pin.originalHeight]);

  return (
    <Box
      position="relative"
      rounding={4}
      overflow="hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image */}
      <TapArea onTap={handleClick} rounding={4}>
        <Mask rounding={4}>
          <Box
            position="relative"
            width={dimensions.width}
            height={dimensions.height}
            color={isLoaded ? undefined : 'secondary'}
          >
            {imageData?.url && (
              <GestaltImage
                src={imageData.url}
                alt={pin.title || 'Pin'}
                naturalWidth={dimensions.width}
                naturalHeight={dimensions.height}
                onLoad={handleImageLoad}
                fit="cover"
              />
            )}
          </Box>
        </Mask>
      </TapArea>

      {/* Hover overlay */}
      {isHovered && (
        <Box
          position="absolute"
          top
          left
          right
          bottom
          display="flex"
          direction="column"
          justifyContent="end"
          dangerouslySetInlineStyle={{
            __style: {
              background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)',
              borderRadius: 16,
              pointerEvents: 'none',
            },
          }}
        >
          <Box padding={2}>
            <Text color="inverse" size="100">
              by @{pin.authorUsername}
            </Text>
          </Box>
        </Box>
      )}

      {/* Title with highlights */}
      {displayTitle && (
        <Box paddingX={1} paddingY={2}>
          <Text 
            size="100" 
            weight="bold" 
            lineClamp={2}
          >
            {/* Render HTML highlights if present */}
            <span 
              dangerouslySetInnerHTML={{ 
                __html: showHighlights ? displayTitle : (pin.title || '') 
              }} 
            />
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default SearchPinCard;