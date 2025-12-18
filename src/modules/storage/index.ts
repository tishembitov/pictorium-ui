// src/modules/storage/index.ts

// Types
export type {
    PresignedUploadRequest,
    PresignedUploadResponse,
    ConfirmUploadRequest,
    ConfirmUploadResponse,
    ImageUrlResponse,
    ImageMetadata,
    UploadStatus,
    UploadProgress as UploadProgressType, // Rename type to avoid conflict
    UploadItem,
    UploadOptions,
    UploadResult,
    ImageCategory,
    ThumbnailOptions,
    FileValidationResult,
    ImageDimensions,
  } from './types/storage.types';
  
  // API
  export { storageApi } from './api/storageApi';
  
  // Hooks
  export { usePresignedUpload } from './hooks/usePresignedUpload';
  export { useConfirmUpload } from './hooks/useConfirmUpload';
  export { useImageUrl, useImageUrls, buildImageUrl } from './hooks/useImageUrl';
  export { useImageMetadata } from './hooks/useImageMetadata';
  export { useDeleteImage } from './hooks/useDeleteImage';
  export { useImageUpload } from './hooks/useImageUpload';
  export { useImagesList } from './hooks/useImagesList';
  export { useImageUploaderLogic } from './hooks/useImageUploaderLogic';
  
  // Components
  export { ImageUploader } from './components/ImageUploader';
  export { ImagePreview } from './components/ImagePreview';
  export { UploadProgress } from './components/UploadProgress';
  
  // Services
  export { uploadService } from './services/uploadService';
  
  // Store
  export {
    useUploadQueueStore,
    selectUploadItems,
    selectIsProcessing,
    selectConcurrentUploads,
    selectPendingCount,
    selectUploadingCount,
    selectCompletedCount,
    selectErrorCount,
  } from './stores/uploadQueueStore';
  
  // Utils
  export {
    validateImageFile,
    getFileExtension,
    getContentTypeFromExtension,
    generateUniqueFilename,
    formatFileSize,
    isImageFile,
    readFileAsDataUrl,
    readFileAsArrayBuffer,
    blobToFile,
    downloadFile,
  } from './utils/fileUtils';
  
  export {
    calculateThumbnailDimensions,
    getImageDimensions,
    calculateAspectRatio,
    calculateProportionalDimensions,
    createImageFromFile,
    createThumbnail,
    compressImage,
    rotateImage,
    createObjectUrl,
    revokeObjectUrl,
    isAnimatedImage,
    getDominantColor,
  } from './utils/imageUtils';