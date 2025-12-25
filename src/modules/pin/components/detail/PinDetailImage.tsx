// src/modules/pin/components/detail/PinDetailImage.tsx

import React, { useState, useCallback } from 'react';
import { Box, IconButton, Layer, TapArea, Spinner } from 'gestalt';
import { useImageUrl } from '@/modules/storage';
import type { PinResponse } from '../../types/pin.types';

interface PinDetailImageProps {
  pin: PinResponse;
}

/**
 * Компонент изображения пина с поддержкой fullscreen режима.
 * Ответственность: отображение и взаимодействие с изображением пина.
 */
export const PinDetailImage: React.FC<PinDetailImageProps> = ({ pin }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const { data: imageData, isLoading } = useImageUrl(pin.imageId, {
    enabled: !!pin.imageId,
  });

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

  // Вычисляем aspect ratio для контейнера
  const aspectRatio =
    pin.originalHeight && pin.originalWidth
      ? pin.originalHeight / pin.originalWidth
      : 1;

  // Ограничиваем максимальную высоту
  const containerPaddingBottom = `${Math.min(aspectRatio * 100, 150)}%`;

  if (isLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={400}
        color="secondary"
        rounding={5}
      >
        <Spinner accessibilityLabel="Loading image" show />
      </Box>
    );
  }

  if (!imageData?.url) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={400}
        color="secondary"
        rounding={5}
      />
    );
  }

  return (
    <>
      {/* Main Image Container */}
      <Box
        position="relative"
        width="100%"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        rounding={5}
        overflow="hidden"
        dangerouslySetInlineStyle={{
          __style: {
            backgroundColor: '#efefef',
          },
        }}
      >
        <TapArea onTap={toggleFullscreen} fullWidth>
          <Box
            position="relative"
            width="100%"
            dangerouslySetInlineStyle={{
              __style: { paddingBottom: containerPaddingBottom },
            }}
          >
            {/* Loading placeholder */}
            {!isImageLoaded && (
              <Box
                position="absolute"
                top
                left
                right
                bottom
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="secondary"
              >
                <Spinner accessibilityLabel="Loading" show size="sm" />
              </Box>
            )}

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
                opacity: isImageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
          </Box>
        </TapArea>

        {/* Zoom Button on Hover */}
        {isHovered && isImageLoaded && (
          <Box position="absolute" bottom right padding={3}>
            <IconButton
              accessibilityLabel="View fullscreen"
              icon="maximize"
              onClick={toggleFullscreen}
              bgColor="white"
              size="md"
            />
          </Box>
        )}
      </Box>

      {/* Fullscreen Modal */}
      {isFullscreen && (
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
            <TapArea onTap={toggleFullscreen} fullWidth fullHeight>
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

            {/* Close Button */}
            <Box position="absolute" top right padding={4}>
              <IconButton
                accessibilityLabel="Close fullscreen"
                icon="cancel"
                onClick={toggleFullscreen}
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