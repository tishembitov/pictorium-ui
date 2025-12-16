// src/modules/storage/components/ImagePreview.tsx

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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

interface LoadState {
  sourceKey: string;
  isLoaded: boolean;
  hasError: boolean;
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
  // Уникальный ключ для текущего источника изображения
  const sourceKey = useMemo(
    () => `${file?.name ?? ''}-${file?.lastModified ?? ''}-${imageId ?? ''}`,
    [file?.name, file?.lastModified, imageId]
  );

  // Единое состояние с ключом источника - автоматически "сбрасывается" при смене источника
  const [loadState, setLoadState] = useState<LoadState>({
    sourceKey: '',
    isLoaded: false,
    hasError: false,
  });

  // Вычисляем актуальное состояние - если ключ не совпадает, значит это новый источник
  const isLoaded = loadState.sourceKey === sourceKey && loadState.isLoaded;
  const hasError = loadState.sourceKey === sourceKey && loadState.hasError;

  // Ref для отслеживания монтирования
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Создаём blob URL через useMemo (не вызываем setState!)
  const localUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  // Очистка blob URL - только cleanup, без setState
  useEffect(() => {
    if (!localUrl) return;

    const urlToRevoke = localUrl;

    return () => {
      // Откладываем revoke для избежания race condition
      setTimeout(() => {
        URL.revokeObjectURL(urlToRevoke);
      }, 100);
    };
  }, [localUrl]);

  // Fetch URL if imageId is provided
  const { data: imageUrlData, isLoading: isLoadingUrl } = useImageUrl(imageId, {
    enabled: !!imageId && !file,
  });

  // Determine which URL to use
  const displayUrl = localUrl || imageUrlData?.url;

  // Обработчики вызываются только как callback от событий браузера
  const handleLoad = useCallback(() => {
    if (isMountedRef.current) {
      setLoadState({ sourceKey, isLoaded: true, hasError: false });
    }
  }, [sourceKey]);

  const handleError = useCallback(() => {
    if (isMountedRef.current) {
      setLoadState({ sourceKey, isLoaded: true, hasError: true });
      console.warn('ImagePreview: Failed to load image', {
        hasFile: !!file,
        hasImageId: !!imageId,
      });
    }
  }, [sourceKey, file, imageId]);

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
            {/* Error placeholder */}
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