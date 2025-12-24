// src/modules/pin/components/PinDetailImage.tsx

import React, { useState, useCallback } from 'react';
import { Box, IconButton, Layer, TapArea } from 'gestalt';
import { useImageUrl } from '@/modules/storage';
import type { PinResponse } from '../types/pin.types';

interface PinDetailImageProps {
  pin: PinResponse;
}

export const PinDetailImage: React.FC<PinDetailImageProps> = ({ pin }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Use full image, not thumbnail
  const { data: imageData } = useImageUrl(pin.imageId, {
    enabled: !!pin.imageId,
  });

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Calculate aspect ratio for container
  const aspectRatio = pin.originalHeight && pin.originalWidth 
    ? pin.originalHeight / pin.originalWidth 
    : 1;

  return (
    <>
      <Box 
        position="relative"
        width="100%"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: '#efefef',
            borderRadius: '32px 0 0 32px',
          },
        }}
      >
        <TapArea onTap={handleToggleFullscreen} fullWidth>
          {/* Image Container with aspect ratio */}
          <Box
            position="relative"
            width="100%"
            dangerouslySetInlineStyle={{
              __style: {
                paddingBottom: `${Math.min(aspectRatio * 100, 150)}%`,
              },
            }}
          >
            {imageData?.url && (
              <img
                src={imageData.url}
                alt={pin.title || 'Pin image'}
                onLoad={handleImageLoad}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '32px 0 0 32px',
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              />
            )}
          </Box>
        </TapArea>

        {/* Zoom button on hover */}
        {isHovered && (
          <Box
            position="absolute"
            bottom
            right
            padding={4}
          >
            <IconButton
              accessibilityLabel="View fullscreen"
              icon="maximize"
              onClick={handleToggleFullscreen}
              bgColor="white"
              size="md"
            />
          </Box>
        )}
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
                cursor: 'zoom-out',
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
                    maxWidth: '95%',
                    maxHeight: '95%',
                    objectFit: 'contain',
                    borderRadius: 16,
                  }}
                />
              </Box>
            </TapArea>

            {/* Close button */}
            <Box 
              position="absolute" 
              top 
              right 
              padding={4}
            >
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