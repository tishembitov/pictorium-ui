// src/modules/storage/utils/fileUtils.ts

import { IMAGE } from '@/shared/utils/constants';
import type { FileValidationResult } from '../types/storage.types';

/**
 * Validate image file
 */
export const validateImageFile = (file: File): FileValidationResult => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file type
  const allowedTypes = IMAGE.ALLOWED_TYPES as readonly string[];
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes
      .map(type => {
        const parts = type.split('/');
        return parts[1] ?? type;
      })
      .join(', ');
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedExtensions}`,
    };
  }

  // Check file size
  if (file.size > IMAGE.MAX_FILE_SIZE) {
    const maxMB = IMAGE.MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File size must be less than ${maxMB}MB`,
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true, file };
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts[parts.length - 1]?.toLowerCase() ?? '') : '';
};

/**
 * Get content type from file extension
 */
export const getContentTypeFromExtension = (extension: string): string => {
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return contentTypes[extension.toLowerCase()] ?? 'application/octet-stream';
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalName: string): string => {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return extension 
    ? `${timestamp}-${random}.${extension}`
    : `${timestamp}-${random}`;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
};

/**
 * Check if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Read file as Data URL
 */
export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Read file as ArrayBuffer
 */
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return file.arrayBuffer();
};

/**
 * Create File from Blob with filename
 */
export const blobToFile = (blob: Blob, filename: string): File => {
  return new File([blob], filename, { type: blob.type });
};

/**
 * Download file from URL
 */
export const downloadFile = async (url: string, filename: string): Promise<void> => {
  const response = await fetch(url);
  const blob = await response.blob();
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};