// src/modules/pin/components/PinDetailImage.tsx

import React, { useState } from 'react';
import { Box, Mask, IconButton, Layer, TapArea } from 'gestalt';
import { useImageUrl } from '@/modules/storage';
import type { PinResponse } from '../types/pin.types';

interface PinDetailImageProps {
  pin: PinResponse;
}

export const PinDetailImage: React.FC<PinDetailImageProps> = ({ pin }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Use full image, not thumbnail
  const { data: imageData } = useImageUrl(pin.imageId, {
    enabled: !!pin.imageId,
  });

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <>
      <Box position="relative" rounding={4} overflow="hidden">
        <TapArea onTap={handleToggleFullscreen}>
          <Mask rounding={4}>
            {imageData?.url ? (
              <img
                src={imageData.url}
                alt={pin.title || 'Pin image'}
                style={{
                  width: '100%',
                  display: 'block',
                  objectFit: 'contain',
                  maxHeight: '80vh',
                }}
              />
            ) : (
              <Box
                color="secondary"
                height={400}
                display="flex"
                alignItems="center"
                justifyContent="center"
              />
            )}
          </Mask>
        </TapArea>

        {/* Expand button */}
        <Box position="absolute" bottom right padding={2}>
          <IconButton
            accessibilityLabel="View fullscreen"
            icon="maximize"
            onClick={handleToggleFullscreen}
            bgColor="white"
            size="md"
          />
        </Box>
      </Box>

      {/* Fullscreen Modal */}
      {isFullscreen && imageData?.url && (
        <Layer>
          <Box
            position="fixed"
            top
            left
            right
            bottom
            display="flex"
            alignItems="center"
            justifyContent="center"
            dangerouslySetInlineStyle={{
              __style: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                zIndex: 999,
              },
            }}
          >
            <TapArea onTap={handleCloseFullscreen} fullWidth fullHeight>
              <Box
                width="100%"
                height="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                padding={4}
              >
                <img
                  src={imageData.url}
                  alt={pin.title || 'Pin image'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            </TapArea>

            {/* Close button */}
            <Box position="absolute" top right padding={4}>
              <IconButton
                accessibilityLabel="Close fullscreen"
                icon="cancel"
                onClick={handleCloseFullscreen}
                bgColor="white"
                size="lg"
              />
            </Box>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default PinDetailImage;