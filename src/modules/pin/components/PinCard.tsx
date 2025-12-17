// src/modules/pin/components/PinCard.tsx

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Mask, TapArea, Text, Flex } from 'gestalt';
import { buildPath } from '@/app/router/routeConfig';
import { useImageUrl } from '@/modules/storage';
import { useAuth } from '@/modules/auth';
import { PinLikeButton } from './PinLikeButton';
import { PinSaveButton } from './PinSaveButton';
import { PinMenuButton } from './PinMenuButton';
import { getPinImageId, getPinTitle } from '../utils/pinUtils';
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

  const imageId = getPinImageId(pin);
  
  const { data: imageData} = useImageUrl(imageId, {
    enabled: !!imageId,
  });

  const handleClick = useCallback(() => {
    navigate(buildPath.pin(pin.id));
  }, [navigate, pin.id]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <Box
      position="relative"
      rounding={4}
      overflow="hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Image */}
      <TapArea onTap={handleClick} rounding={4}>
        <Mask rounding={4}>
          {imageData?.url ? (
            <img
              src={imageData.url}
              alt={getPinTitle(pin)}
              style={{
                width: '100%',
                display: 'block',
                objectFit: 'cover',
              }}
              loading="lazy"
            />
          ) : (
            <Box
              color="secondary"
              height={200}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="subtle">Loading...</Text>
            </Box>
          )}
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
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%)',
              pointerEvents: 'none',
            },
          }}
        >
          {/* Top Actions */}
          <Box padding={2} display="flex" justifyContent="end">
            <Box dangerouslySetInlineStyle={{ __style: { pointerEvents: 'auto' } }}>
              <Flex gap={2}>
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
              <Flex gap={2}>
                <PinLikeButton
                  pinId={pin.id}
                  isLiked={pin.isLiked}
                  likeCount={pin.likeCount}
                  size="sm"
                  variant="icon"
                />
              </Flex>
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

      {/* Title (always visible) */}
      {pin.title && (
        <Box paddingX={1} paddingY={2}>
          <Text size="200" weight="bold" lineClamp={2}>
            {pin.title}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default PinCard;