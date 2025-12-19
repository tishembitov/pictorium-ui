// src/modules/storage/hooks/useDownloadImage.ts

import { useState, useCallback } from 'react';
import { storageApi } from '../api/storageApi';

interface DownloadOptions {
  fileName?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseDownloadImageReturn {
  download: (imageId: string, options?: DownloadOptions) => Promise<void>;
  isDownloading: boolean;
  error: Error | null;
  reset: () => void;
}

// Маппинг content-type на расширения
const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/**
 * Генерирует безопасное имя файла
 */
const sanitizeFileName = (name: string): string => {
    return name
      .replaceAll(/[^a-zA-Z0-9\s\-_]/g, '')
      .replaceAll(/\s+/g, '_')
      .slice(0, 50);
  };

/**
 * Hook для скачивания изображений
 */
export const useDownloadImage = (): UseDownloadImageReturn => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setIsDownloading(false);
  }, []);

  const download = useCallback(
    async (imageId: string, options: DownloadOptions = {}): Promise<void> => {
      const { fileName, onSuccess, onError } = options;

      if (isDownloading) return;

      setIsDownloading(true);
      setError(null);

      try {
        // Получаем blob изображения
        const blob = await storageApi.downloadImage(imageId);

        // Определяем расширение файла
        const contentType = blob.type || 'image/jpeg';
        const extension = EXTENSION_MAP[contentType] || 'jpg';

        // Генерируем имя файла
        const finalFileName = fileName
          ? `${sanitizeFileName(fileName)}.${extension}`
          : `image_${imageId}.${extension}`;

        // Создаём ссылку и скачиваем
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Download failed');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsDownloading(false);
      }
    },
    [isDownloading]
  );

  return {
    download,
    isDownloading,
    error,
    reset,
  };
};

export default useDownloadImage;