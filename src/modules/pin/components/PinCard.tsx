// ================================================
// FILE: src/modules/pin/components/PinCard.tsx
// ================================================

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Mask, TapArea, Text, Flex, Image as GestaltImage } from 'gestalt';
import { buildPath } from '@/app/router/routeConfig';
import { useImageUrl } from '@/modules/storage';
import { useAuth } from '@/modules/auth';
import { PinLikeButton } from './PinLikeButton';
import { PinSaveButton } from './PinSaveButton';
import { PinMenuButton } from './PinMenuButton';
import type { PinResponse } from '../types/pin.types';

interface PinCardProps {
  pin: PinResponse;
  showActions?: boolean;
  onDelete?: () => void;
}

export const PinCard: React.FC<PinCardProps> = ({
  pin,
  showActions = true,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Используем thumbnailId для сетки
  const imageId = pin.thumbnailId || pin.imageId;
  
  const { data: imageData } = useImageUrl(imageId, {
    enabled: !!imageId,
  });

  const handleClick = useCallback(() => {
    navigate(buildPath.pin(pin.id));
  }, [navigate, pin.id]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleImageLoad = useCallback(() => setIsLoaded(true), []);

  // === Размеры известны заранее! ===
  const dimensions = useMemo(() => ({
    width: pin.thumbnailWidth,
    height: pin.thumbnailHeight,
  }), [pin.thumbnailWidth, pin.thumbnailHeight]);

  return (
    <Box
      position="relative"
      rounding={4}
      overflow="hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <TapArea onTap={handleClick} rounding={4}>
        <Mask rounding={4}>
          {/* Placeholder с ТОЧНЫМИ размерами - никаких прыжков! */}
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

      {/* Hover Overlay */}
      {isHovered && showActions && (
        <Box
          position="absolute"
          top
          left
          right
          bottom
          display="flex"
          direction="column"
          justifyContent="between"
          dangerouslySetInlineStyle={{
            __style: {
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.3) 100%)',
              pointerEvents: 'none',
            },
          }}
        >
          {/* Top Actions */}
          <Box padding={2} display="flex" justifyContent="end">
            <Box dangerouslySetInlineStyle={{ __style: { pointerEvents: 'auto' } }}>
              <Flex gap={1}>
                {isAuthenticated && (
                  <PinSaveButton
                    pinId={pin.id}
                    isSaved={pin.isSaved}
                    size="sm"
                  />
                )}
              </Flex>
            </Box>
          </Box>

          {/* Bottom Actions */}
          <Box padding={2} display="flex" justifyContent="between" alignItems="center">
            <Box dangerouslySetInlineStyle={{ __style: { pointerEvents: 'auto' } }}>
              <PinLikeButton
                pinId={pin.id}
                isLiked={pin.isLiked}
                likeCount={pin.likeCount}
                size="sm"
                variant="icon"
              />
            </Box>
            
            <Box dangerouslySetInlineStyle={{ __style: { pointerEvents: 'auto' } }}>
              <PinMenuButton
                pin={pin}
                onDelete={onDelete}
                size="sm"
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* Title */}
      {pin.title && (
        <Box paddingX={1} paddingY={2}>
          <Text size="100" weight="bold" lineClamp={2}>
            {pin.title}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default PinCard;