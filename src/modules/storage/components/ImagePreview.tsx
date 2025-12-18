// src/modules/storage/components/ImagePreview.tsx

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Box, Mask, IconButton, Spinner } from 'gestalt';
import { useImageUrl } from '../hooks/useImageUrl';

interface ImagePreviewProps {
  file?: File;
  imageId?: string | null;
  src?: string | null;
  alt: string;
  width?: number | string;
  height?: number | string;
  fit?: 'contain' | 'cover' | 'none';
  rounding?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'circle';
  onRemove?: () => void;
  showRemoveButton?: boolean;
  placeholderColor?: string;
}

interface LoadState {
  sourceKey: string;
  isLoaded: boolean;
  hasError: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  file,
  imageId,
  src,
  alt,
  width = '100%',
  height = 300,
  fit = 'cover',
  rounding = 2,
  onRemove,
  showRemoveButton = false,
  placeholderColor = 'var(--bg-secondary)',
}) => {
  const sourceKey = useMemo(
    () => `${file?.name ?? ''}-${file?.lastModified ?? ''}-${imageId ?? ''}-${src ?? ''}`,
    [file?.name, file?.lastModified, imageId, src]
  );

  const [loadState, setLoadState] = useState<LoadState>({
    sourceKey: '',
    isLoaded: false,
    hasError: false,
  });

  const isLoaded = loadState.sourceKey === sourceKey && loadState.isLoaded;
  const hasError = loadState.sourceKey === sourceKey && loadState.hasError;

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const localUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!localUrl) return;
    const urlToRevoke = localUrl;
    return () => {
      setTimeout(() => {
        URL.revokeObjectURL(urlToRevoke);
      }, 100);
    };
  }, [localUrl]);

  const shouldFetchUrl = !!imageId && !file && !src;
  const { data: imageUrlData, isLoading: isLoadingUrl } = useImageUrl(imageId, {
    enabled: shouldFetchUrl,
  });

  const displayUrl = localUrl || src || imageUrlData?.url;

  const handleLoad = useCallback(() => {
    if (isMountedRef.current) {
      setLoadState({ sourceKey, isLoaded: true, hasError: false });
    }
  }, [sourceKey]);

  const handleError = useCallback(() => {
    if (isMountedRef.current) {
      setLoadState({ sourceKey, isLoaded: true, hasError: true });
    }
  }, [sourceKey]);

  if (shouldFetchUrl && isLoadingUrl) {
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

  if (!displayUrl || hasError) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={width}
        height={height}
        color="secondary"
        rounding={rounding}
      />
    );
  }

  return (
    <Box 
      position="relative" 
      width={width}
      rounding={rounding}
      overflow="hidden"
      dangerouslySetInlineStyle={{
        __style: { 
          height: typeof height === 'number' ? `${height}px` : height,
        },
      }}
    >
      {!isLoaded && (
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
            __style: { backgroundColor: placeholderColor },
          }}
        >
          <Spinner accessibilityLabel="Loading" show size="sm" />
        </Box>
      )}

      <Mask rounding={rounding}>
        <img
          src={displayUrl}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: typeof height === 'number' ? `${height}px` : height,
            objectFit: fit,
            display: 'block',
          }}
        />
      </Mask>

      {showRemoveButton && onRemove && isLoaded && (
        <Box
          position="absolute"
          top
          right
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