// src/modules/storage/components/ImagePreview.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Box, Image as GestaltImage, Mask, IconButton, Spinner } from 'gestalt';
import { useImageUrl } from '../hooks/useImageUrl';

interface ImagePreviewProps {
  file?: File;
  imageId?: string | null;
  alt: string;
  width?: number | string;
  height?: number | string;
  fit?: 'contain' | 'cover' | 'none';
  rounding?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'circle';
  onRemove?: () => void;
  showRemoveButton?: boolean;
  placeholderColor?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  file,
  imageId,
  alt,
  width = '100%',
  height = 'auto',
  fit = 'cover',
  rounding = 2,
  onRemove,
  showRemoveButton = false,
  placeholderColor = 'var(--bg-secondary)',
}) => {
  // Generate a unique key for the current source
  const sourceKey = useMemo(
    () => `${file?.name || ''}-${file?.lastModified || ''}-${imageId || ''}`,
    [file, imageId]
  );

  // Combined state with source key tracking
  const [loadState, setLoadState] = useState({
    key: '',
    isLoaded: false,
    hasError: false,
  });

  // Derive actual state - automatically resets when source changes
  const isLoaded = loadState.key === sourceKey ? loadState.isLoaded : false;
  const hasError = loadState.key === sourceKey ? loadState.hasError : false;

  // Fetch URL if imageId is provided
  const { data: imageUrlData, isLoading: isLoadingUrl } = useImageUrl(imageId, {
    enabled: !!imageId && !file,
  });

  // Create local URL using useMemo instead of useState + useEffect
  const localUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  // Cleanup: revoke URL when it changes or component unmounts
  useEffect(() => {
    if (!localUrl) return;
    
    return () => {
      URL.revokeObjectURL(localUrl);
    };
  }, [localUrl]);

  // Determine which URL to use
  const displayUrl = localUrl || imageUrlData?.url;

  const handleLoad = () => {
    setLoadState({ key: sourceKey, isLoaded: true, hasError: false });
  };

  const handleError = () => {
    setLoadState({ key: sourceKey, isLoaded: true, hasError: true });
  };

  // Loading state
  if (isLoadingUrl && !localUrl) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={width}
        height={height}
        color="secondary"
        rounding={rounding}
      >
        <Spinner accessibilityLabel="Loading image" show />
      </Box>
    );
  }

  // Error state
  if (hasError || (!displayUrl && !isLoadingUrl)) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={width}
        height={height}
        color="secondary"
        rounding={rounding}
      >
        <Box padding={4}>
          <Box color="tertiary" rounding="circle" padding={3}>
            {/* Placeholder icon */}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box position="relative" width={width} height={height}>
      {/* Loading placeholder */}
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

      {/* Image */}
      {displayUrl && (
        <Mask rounding={rounding}>
          <GestaltImage
            src={displayUrl}
            alt={alt}
            naturalWidth={1}
            naturalHeight={1}
            fit={fit}
            onLoad={handleLoad}
            onError={handleError}
          />
        </Mask>
      )}

      {/* Remove button */}
      {showRemoveButton && onRemove && (
        <Box
          position="absolute"
          top
          right
          padding={1}
          dangerouslySetInlineStyle={{
            __style: { margin: '8px' },
          }}
        >
          <IconButton
            accessibilityLabel="Remove image"
            icon="cancel"
            onClick={onRemove}
            size="sm"
            bgColor="white"
          />
        </Box>
      )}
    </Box>
  );
};

export default ImagePreview;