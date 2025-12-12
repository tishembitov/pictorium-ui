// src/modules/storage/components/ImageUploader.tsx

import React from 'react';
import { Box, Text, Icon, Button, Flex, TapArea } from 'gestalt';
import { useImageUploaderLogic } from '../hooks/useImageUploaderLogic';
import { ImagePreview } from './ImagePreview';
import { UploadProgressComponent } from './UploadProgress';
import type { UploadResult } from '../types/storage.types';
import { IMAGE } from '@/shared/utils/constants';

interface ImageUploaderProps {
  onUploadComplete?: (result: UploadResult) => void;
  onFileSelect?: (file: File) => void;
  onError?: (error: string) => void;
  category?: string;
  generateThumbnail?: boolean;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  maxFiles?: number;
  autoUpload?: boolean;
  showPreview?: boolean;
  showProgress?: boolean;
  placeholder?: React.ReactNode;
  accept?: string;
  disabled?: boolean;
  compact?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadComplete,
  onFileSelect,
  onError,
  category,
  generateThumbnail = false,
  thumbnailWidth,
  thumbnailHeight,
  maxFiles = 1,
  autoUpload = false,
  showPreview = true,
  showProgress = true,
  placeholder,
  accept = IMAGE.ALLOWED_TYPES.join(','),
  disabled = false,
  compact = false,
}) => {
  const {
    selectedFiles,
    isDragOver,
    status,
    progress,
    isUploading,
    isCompleted,
    hasFiles,
    fileInputRef,
    handleInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    openFilePicker,
    removeFile,
    startUpload,
    error,
  } = useImageUploaderLogic({
    maxFiles,
    category,
    generateThumbnail,
    thumbnailWidth,
    thumbnailHeight,
    autoUpload,
    onUploadComplete,
    onError,
  });

  // Notify parent about file selection
  React.useEffect(() => {
    if (selectedFiles.length > 0 && onFileSelect) {
      const firstFile = selectedFiles[0];
      if (firstFile) {
        onFileSelect(firstFile.file);
      }
    }
  }, [selectedFiles, onFileSelect]);

  const renderDropZone = () => (
    <TapArea
      onTap={openFilePicker}
      disabled={disabled || isUploading}
      rounding={3}
    >
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        padding={compact ? 4 : 8}
        rounding={3}
        color={isDragOver ? 'secondary' : 'default'}
        display="flex"
        direction="column"
        alignItems="center"
        justifyContent="center"
        minHeight={compact ? 120 : 200}
        dangerouslySetInlineStyle={{
          __style: {
            border: `2px dashed ${isDragOver ? 'var(--color-primary)' : 'var(--border-default)'}`,
            transition: 'all 0.2s ease',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          },
        }}
      >
        {placeholder || (
          <>
            <Box marginBottom={3} color="secondary" rounding="circle" padding={3}>
              <Icon
                accessibilityLabel="Upload"
                icon="add"
                size={compact ? 24 : 32}
                color="default"
              />
            </Box>
            <Text align="center" weight="bold" size={compact ? '200' : '300'}>
              {isDragOver ? 'Drop image here' : 'Click or drag to upload'}
            </Text>
            <Text align="center" color="subtle" size="100">
              {`Supports: ${IMAGE.ALLOWED_TYPES.map(t => t.split('/')[1]).join(', ')}`}
            </Text>
            <Text align="center" color="subtle" size="100">
              {`Max size: ${IMAGE.MAX_FILE_SIZE / (1024 * 1024)}MB`}
            </Text>
          </>
        )}
      </Box>
    </TapArea>
  );

  const renderPreview = () => {
    if (!showPreview || selectedFiles.length === 0) return null;

    return (
      <Box marginTop={4}>
        {selectedFiles.map((selectedFile) => (
          <Box key={selectedFile.id} position="relative">
            <ImagePreview
              file={selectedFile.file}
              alt={selectedFile.file.name}
              height={compact ? 150 : 250}
              rounding={3}
              showRemoveButton={!isUploading && !isCompleted}
              onRemove={() => removeFile(selectedFile.id)}
            />
          </Box>
        ))}
      </Box>
    );
  };

  const renderProgress = () => {
    if (!showProgress || !hasFiles || status === 'idle') return null;

    const firstFile = selectedFiles[0];

    return (
      <Box marginTop={4}>
        <UploadProgressComponent
          status={status}
          progress={progress}
          fileName={firstFile?.file.name}
          error={error || undefined}
        />
      </Box>
    );
  };

  const renderActions = () => {
    if (!hasFiles || autoUpload || isCompleted) return null;

    const firstFile = selectedFiles[0];
    if (!firstFile) return null;

    return (
      <Box marginTop={4}>
        <Flex gap={2} justifyContent="end">
          <Button
            text="Clear"
            onClick={() => removeFile(firstFile.id)}
            color="gray"
            size="md"
            disabled={isUploading}
          />
          <Button
            text={isUploading ? 'Uploading...' : 'Upload'}
            onClick={startUpload}
            color="red"
            size="md"
            disabled={isUploading}
          />
        </Flex>
      </Box>
    );
  };

  return (
    <Box>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        multiple={maxFiles > 1}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Drop zone - show when no files or when completed */}
      {(!hasFiles || isCompleted) && renderDropZone()}

      {/* Preview */}
      {renderPreview()}

      {/* Progress */}
      {renderProgress()}

      {/* Actions */}
      {renderActions()}
    </Box>
  );
};

export default ImageUploader;