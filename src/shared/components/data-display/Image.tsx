// src/shared/components/data-display/Image.tsx
import React, { useState } from 'react';
import { Image as GestaltImage, Box, Mask } from 'gestalt';

interface ImageProps {
  src: string;
  alt: string;
  naturalWidth?: number;
  naturalHeight?: number;
  fit?: 'contain' | 'cover' | 'none';
  loading?: 'eager' | 'lazy';
  onError?: () => void;
  onLoad?: () => void;
  placeholderColor?: string;
  rounding?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'circle';
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  naturalWidth = 1,
  naturalHeight = 1,
  fit = 'cover',
  loading = 'lazy',
  onError,
  onLoad,
  placeholderColor = 'var(--bg-secondary)',
  rounding = 0,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <Box
        color="secondary"
        width="100%"
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        rounding={rounding}
      >
        <Box color="tertiary" padding={4} rounding="circle">
          {/* Placeholder for broken image */}
        </Box>
      </Box>
    );
  }

  return (
    <Box position="relative" width="100%" height="100%">
      {!isLoaded && (
        <Box
          position="absolute"
          top
          left
          right
          bottom
          color="secondary"
          rounding={rounding}
          dangerouslySetInlineStyle={{
            __style: { backgroundColor: placeholderColor },
          }}
        />
      )}
      <Mask rounding={rounding}>
        <GestaltImage
          src={src}
          alt={alt}
          naturalWidth={naturalWidth}
          naturalHeight={naturalHeight}
          fit={fit}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
        />
      </Mask>
    </Box>
  );
};

export default Image;