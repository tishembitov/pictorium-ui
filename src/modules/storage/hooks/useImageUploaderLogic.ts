// src/modules/storage/components/useImageUploaderLogic.ts

import { useState, useCallback, useRef } from 'react';
import { useImageUpload } from '../hooks/useImageUpload';
import { validateImageFile } from '../utils/fileUtils';
import { createObjectUrl, revokeObjectUrl } from '../utils/imageUtils';
import type { UploadOptions, UploadResult } from '../types/storage.types';

interface UseImageUploaderLogicOptions {
  maxFiles?: number;
  category?: string;
  generateThumbnail?: boolean;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  onUploadComplete?: (result: UploadResult) => void;
  onError?: (error: string) => void;
  autoUpload?: boolean;
}

interface SelectedFile {
  id: string;
  file: File;
  previewUrl: string;
  error?: string;
}

export const useImageUploaderLogic = (options: UseImageUploaderLogicOptions = {}) => {
  const {
    maxFiles = 1,
    category,
    generateThumbnail = false,
    thumbnailWidth,
    thumbnailHeight,
    onUploadComplete,
    onError,
    autoUpload = false,
  } = options;

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    upload,
    status,
    progress,
    result,
    error: uploadError,
    reset: resetUpload,
    isUploading,
    isCompleted,
  } = useImageUpload();

  // Handle file selection
  const handleFileSelect = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, maxFiles);
      const newSelectedFiles: SelectedFile[] = [];

      for (const file of fileArray) {
        const validation = validateImageFile(file);
        
        if (!validation.valid) {
          onError?.(validation.error || 'Invalid file');
          continue;
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const previewUrl = createObjectUrl(file);

        newSelectedFiles.push({
          id,
          file,
          previewUrl,
        });
      }

      setSelectedFiles((prev) => {
        // Clean up old preview URLs
        prev.forEach((f) => revokeObjectUrl(f.previewUrl));
        return newSelectedFiles;
      });

      // Auto upload if enabled
      if (autoUpload && newSelectedFiles.length > 0) {
        const firstFile = newSelectedFiles[0];
        if (firstFile) {
          const uploadOptions: UploadOptions = {
            category,
            generateThumbnail,
            thumbnailWidth,
            thumbnailHeight,
          };

          upload(firstFile.file, uploadOptions)
            .then((res) => {
              onUploadComplete?.(res);
            })
            .catch((err: unknown) => {
              const errorMessage = err instanceof Error ? err.message : 'Upload failed';
              onError?.(errorMessage);
            });
        }
      }
    },
    [
      maxFiles,
      category,
      generateThumbnail,
      thumbnailWidth,
      thumbnailHeight,
      autoUpload,
      upload,
      onUploadComplete,
      onError,
    ]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        handleFileSelect(event.target.files);
      }
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    },
    [handleFileSelect]
  );

  // Handle drag events
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);

      if (event.dataTransfer.files) {
        handleFileSelect(event.dataTransfer.files);
      }
    },
    [handleFileSelect]
  );

  // Trigger file input click
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Remove selected file
  const removeFile = useCallback((id: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        revokeObjectUrl(file.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
    resetUpload();
  }, [resetUpload]);

  // Clear all files
  const clearFiles = useCallback(() => {
    selectedFiles.forEach((f) => revokeObjectUrl(f.previewUrl));
    setSelectedFiles([]);
    resetUpload();
  }, [selectedFiles, resetUpload]);

  // Manual upload trigger
  const startUpload = useCallback(async (): Promise<UploadResult | null> => {
    if (selectedFiles.length === 0) {
      return null;
    }

    const firstFile = selectedFiles[0];
    if (!firstFile) {
      return null;
    }

    const uploadOptions: UploadOptions = {
      category,
      generateThumbnail,
      thumbnailWidth,
      thumbnailHeight,
    };

    try {
      const uploadResult = await upload(firstFile.file, uploadOptions);
      onUploadComplete?.(uploadResult);
      return uploadResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      onError?.(errorMessage);
      return null;
    }
  }, [
    selectedFiles,
    category,
    generateThumbnail,
    thumbnailWidth,
    thumbnailHeight,
    upload,
    onUploadComplete,
    onError,
  ]);

  return {
    // State
    selectedFiles,
    isDragOver,
    status,
    progress,
    result,
    error: uploadError,
    isUploading,
    isCompleted,
    hasFiles: selectedFiles.length > 0,

    // Refs
    fileInputRef,

    // Handlers
    handleInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    openFilePicker,
    removeFile,
    clearFiles,
    startUpload,
    resetUpload,
  };
};

export default useImageUploaderLogic;