// src/shared/components/forms/ImageUploadArea.tsx

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Box, Flex, Button, Text, Icon, TapArea, Spinner } from 'gestalt';
import { useImageUpload, useImageUrl } from '@/modules/storage';
import type { UploadResult } from '@/modules/storage';

interface ImageUploadAreaProps {
  /** Current image ID (for edit mode) */
  imageId?: string | null;
  /** Callback when upload completes */
  onUploadComplete: (result: UploadResult) => void;
  /** Callback when image is removed */
  onRemove?: () => void;
  /** Upload category */
  category?: 'pins' | 'avatars' | 'banners';
  /** Whether to generate thumbnail */
  generateThumbnail?: boolean;
  /** Aspect ratio for container */
  aspectRatio?: string;
  /** Placeholder text */
  placeholderText?: string;
  /** Placeholder subtext */
  placeholderSubtext?: string;
  /** Show dimensions after upload */
  showDimensions?: boolean;
  /** Custom width */
  width?: number | string;
  /** Error message */
  errorMessage?: string;
}

export const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({
  imageId,
  onUploadComplete,
  onRemove,
  category = 'pins',
  generateThumbnail = true,
  aspectRatio = '2 / 3',
  placeholderText = 'Click to upload',
  placeholderSubtext = 'or drag and drop',
  showDimensions = true,
  width = '100%',
  errorMessage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedDimensions, setUploadedDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const { upload, isUploading } = useImageUpload();
  const { data: existingImageData } = useImageUrl(imageId, {
    enabled: !!imageId && !previewUrl,
  });

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Cleanup previous preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // Create new preview
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);

      try {
        const result = await upload(file, {
          category,
          generateThumbnail,
          thumbnailWidth: 236,
        });

        setUploadedDimensions({
          width: result.originalWidth,
          height: result.originalHeight,
        });

        onUploadComplete(result);
      } catch (error) {
        console.error('Upload failed:', error);
        URL.revokeObjectURL(newPreviewUrl);
        setPreviewUrl(null);
        setUploadedDimensions(null);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [upload, category, generateThumbnail, onUploadComplete, previewUrl]
  );

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedDimensions(null);
    onRemove?.();
  }, [previewUrl, onRemove]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const displayUrl = previewUrl || existingImageData?.url;
  const hasImage = !!displayUrl;

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <Box
        position="relative"
        width={width}
        rounding={3}
        overflow="hidden"
        dangerouslySetInlineStyle={{
          __style: {
            aspectRatio,
            backgroundColor: 'var(--bg-secondary)',
            border: hasImage ? 'none' : '2px dashed var(--border-default)',
          },
        }}
      >
        {hasImage ? (
          <>
            <img
              src={displayUrl}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {isUploading && (
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
                  __style: { backgroundColor: 'rgba(255,255,255,0.8)' },
                }}
              >
                <Flex direction="column" alignItems="center" gap={2}>
                  <Spinner accessibilityLabel="Uploading" show />
                  <Text size="200" weight="bold">
                    Uploading...
                  </Text>
                </Flex>
              </Box>
            )}
          </>
        ) : (
          <TapArea
            onTap={handleUploadClick}
            rounding={3}
            disabled={isUploading}
            fullWidth
            fullHeight
          >
            <Box
              width="100%"
              height="100%"
              display="flex"
              direction="column"
              alignItems="center"
              justifyContent="center"
              padding={4}
            >
              {isUploading ? (
                <Spinner accessibilityLabel="Uploading" show />
              ) : (
                <>
                  <Box marginBottom={2} color="secondary" rounding="circle" padding={3}>
                    <Icon
                      accessibilityLabel="Upload image"
                      icon="camera"
                      size={24}
                      color="subtle"
                    />
                  </Box>
                  <Text weight="bold" align="center" size="200">
                    {placeholderText}
                  </Text>
                  {placeholderSubtext && (
                    <Box marginTop={1}>
                      <Text color="subtle" align="center" size="100">
                        {placeholderSubtext}
                      </Text>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </TapArea>
        )}
      </Box>

      {/* Action buttons */}
      {hasImage && !isUploading && (
        <Box marginTop={2}>
          <Flex gap={2}>
            <Button text="Change" onClick={handleUploadClick} size="sm" color="gray" />
            {onRemove && (
              <Button text="Remove" onClick={handleRemove} size="sm" color="transparent" />
            )}
          </Flex>
        </Box>
      )}

      {/* Error message */}
      {errorMessage && (
        <Box marginTop={2}>
          <Text color="error" size="100">
            {errorMessage}
          </Text>
        </Box>
      )}

      {/* Dimensions */}
      {showDimensions && uploadedDimensions && !isUploading && (
        <Box marginTop={2}>
          <Text color="subtle" size="100">
            {uploadedDimensions.width} × {uploadedDimensions.height} px
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default ImageUploadArea;