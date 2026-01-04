// src/modules/pin/components/PinCard.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Mask, TapArea, Text, Image as GestaltImage, Flex } from 'gestalt';
import { buildPath } from '@/app/router/routeConfig';
import { useImageUrl } from '@/modules/storage';
import { useAuth } from '@/modules/auth';
import { CompactSaveSection } from './CompactSaveSection';
import { PinShareButton } from './PinShareButton';
import { PinMenuButton } from './PinMenuButton';
import { usePinLocalState } from '../hooks/usePinLocalState';
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

  // ✅ Единый локальный state
  const { 
    state: localState, 
    markAsSaved, 
    markAsRemoved,
  } = usePinLocalState(pin);

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

  const dimensions = useMemo(() => ({
    width: pin.thumbnailWidth || 236,
    height: pin.thumbnailHeight || 300,
  }), [pin.thumbnailWidth, pin.thumbnailHeight]);

  return (
    <Box
      position="relative"
      rounding={4}
      overflow="hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image Container */}
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
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%)',
              pointerEvents: 'none',
              borderRadius: 16,
            },
          }}
        >
          {/* Top Actions */}
          <Box padding={2} display="flex" justifyContent="end">
            <Box dangerouslySetInlineStyle={{ __style: { pointerEvents: 'auto' } }}>
              {isAuthenticated ? (
                <CompactSaveSection
                  pinId={pin.id}
                  pinTitle={pin.title}
                  localState={localState}
                  onSave={markAsSaved}
                  onRemove={markAsRemoved}
                />
              ) : (
                <TapArea onTap={() => {}} rounding="pill" tapStyle="compress">
                  <Box
                    paddingX={3}
                    paddingY={2}
                    rounding="pill"
                    dangerouslySetInlineStyle={{
                      __style: { backgroundColor: '#e60023' },
                    }}
                  >
                    <Text color="inverse" weight="bold" size="200">
                      Save
                    </Text>
                  </Box>
                </TapArea>
              )}
            </Box>
          </Box>

          {/* Bottom Actions */}
          <Box padding={2} display="flex" justifyContent="end">
            <Box dangerouslySetInlineStyle={{ __style: { pointerEvents: 'auto' } }}>
              <Flex gap={2} alignItems="center">
                <PinShareButton pin={pin} size="sm" variant="overlay" />
                <PinMenuButton pin={pin} onDelete={onDelete} size="sm" variant="overlay" />
              </Flex>
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