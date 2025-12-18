// src/modules/storage/utils/imageUtils.ts

import type { ImageDimensions, ThumbnailOptions } from '../types/storage.types';

/**
 * Get image dimensions from file
 */
export const getImageDimensions = async (file: File): Promise<ImageDimensions> => {
  // Пробуем createImageBitmap (быстрее, не блокирует UI)
  if ('createImageBitmap' in globalThis) {
    try {
      const bitmap = await createImageBitmap(file);
      const dimensions = {
        width: bitmap.width,
        height: bitmap.height,
      };
      bitmap.close(); // Освобождаем память
      return dimensions;
    } catch {
      // Fallback to Image API
    }
  }

  // Fallback: Image API
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Вычисляет размеры thumbnail с сохранением пропорций
 */
export const calculateThumbnailDimensions = (
  originalWidth: number,
  originalHeight: number,
  targetWidth: number = 236
): ImageDimensions => {
  const aspectRatio = originalHeight / originalWidth;
  return {
    width: targetWidth,
    height: Math.round(targetWidth * aspectRatio),
  };
};

/**
 * Calculate aspect ratio
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};

/**
 * Calculate dimensions maintaining aspect ratio
 */
export const calculateProportionalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): ImageDimensions => {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height),
  };
};

/**
 * Create image element from file
 */
export const createImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Create thumbnail from image file
 */
export const createThumbnail = async (
  file: File,
  options: ThumbnailOptions
): Promise<Blob> => {
  const { width, height, quality = 0.8 } = options;
  
  const img = await createImageFromFile(file);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  // Calculate dimensions maintaining aspect ratio
  const dimensions = calculateProportionalDimensions(
    img.naturalWidth,
    img.naturalHeight,
    width,
    height
  );
  
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  
  // Draw image on canvas
  ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
  
  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create thumbnail'));
        }
      },
      'image/jpeg',
      quality
    );
  });
};

/**
 * Compress image
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.85
): Promise<Blob> => {
  const img = await createImageFromFile(file);
  
  // Check if compression is needed
  if (img.naturalWidth <= maxWidth && img.naturalHeight <= maxHeight) {
    return file;
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  const dimensions = calculateProportionalDimensions(
    img.naturalWidth,
    img.naturalHeight,
    maxWidth,
    maxHeight
  );
  
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  
  ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to compress image'));
        }
      },
      file.type,
      quality
    );
  });
};

/**
 * Rotate image
 */
export const rotateImage = async (
  file: File,
  degrees: number
): Promise<Blob> => {
  const img = await createImageFromFile(file);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  // Swap dimensions for 90/270 degree rotations
  const isVerticalRotation = degrees === 90 || degrees === 270;
  canvas.width = isVerticalRotation ? img.naturalHeight : img.naturalWidth;
  canvas.height = isVerticalRotation ? img.naturalWidth : img.naturalHeight;
  
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to rotate image'));
        }
      },
      file.type
    );
  });
};

/**
 * Create object URL for file
 */
export const createObjectUrl = (file: File | Blob): string => {
  return URL.createObjectURL(file);
};

/**
 * Revoke object URL
 */
export const revokeObjectUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Check if image is animated (GIF)
 */
export const isAnimatedImage = (file: File): boolean => {
  return file.type === 'image/gif';
};

/**
 * Get dominant color from image (simplified version)
 */
export const getDominantColor = async (file: File): Promise<string> => {
  const img = await createImageFromFile(file);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return '#cccccc';
  }
  
  // Use small canvas for performance
  canvas.width = 10;
  canvas.height = 10;
  
  ctx.drawImage(img, 0, 0, 10, 10);
  
  const imageData = ctx.getImageData(0, 0, 10, 10).data;
  
  let r = 0, g = 0, b = 0;
  const pixelCount = 100;
  
  for (let i = 0; i < imageData.length; i += 4) {
    r += imageData[i] ?? 0;
    g += imageData[i + 1] ?? 0;
    b += imageData[i + 2] ?? 0;
  }
  
  r = Math.round(r / pixelCount);
  g = Math.round(g / pixelCount);
  b = Math.round(b / pixelCount);
  
  return `rgb(${r}, ${g}, ${b})`;
};