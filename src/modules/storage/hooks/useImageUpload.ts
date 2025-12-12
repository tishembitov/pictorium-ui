// src/modules/storage/hooks/useImageUpload.ts

import { useState, useCallback } from 'react';
import { uploadService } from '../services/uploadService';
import { validateImageFile } from '../utils/fileUtils';
import type {
  UploadOptions,
  UploadResult,
  UploadProgress,
  UploadStatus,
  FileValidationResult,
} from '../types/storage.types';

interface UseImageUploadState {
  status: UploadStatus;
  progress: UploadProgress;
  result: UploadResult | null;
  error: string | null;
}

interface UseImageUploadReturn extends UseImageUploadState {
  upload: (file: File, options?: UploadOptions) => Promise<UploadResult>;
  validate: (file: File) => FileValidationResult;
  reset: () => void;
  isIdle: boolean;
  isUploading: boolean;
  isCompleted: boolean;
  isError: boolean;
}

const initialState: UseImageUploadState = {
  status: 'idle',
  progress: { loaded: 0, total: 0, percentage: 0 },
  result: null,
  error: null,
};

/**
 * Comprehensive hook for image upload
 */
export const useImageUpload = (): UseImageUploadReturn => {
  const [state, setState] = useState<UseImageUploadState>(initialState);

  const validate = useCallback((file: File): FileValidationResult => {
    return validateImageFile(file);
  }, []);

  const upload = useCallback(
    async (file: File, options: UploadOptions = {}): Promise<UploadResult> => {
      // Validate
      const validation = validate(file);
      if (!validation.valid) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: validation.error || 'Invalid file',
        }));
        throw new Error(validation.error);
      }

      // Start upload
      setState({
        status: 'preparing',
        progress: { loaded: 0, total: file.size, percentage: 0 },
        result: null,
        error: null,
      });

      try {
        const result = await uploadService.uploadFile(file, {
          ...options,
          onProgress: (progress) => {
            setState((prev) => ({
              ...prev,
              status: 'uploading',
              progress,
            }));
            options.onProgress?.(progress);
          },
        });

        setState({
          status: 'completed',
          progress: { loaded: file.size, total: file.size, percentage: 100 },
          result,
          error: null,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: errorMessage,
        }));
        throw error;
      }
    },
    [validate]
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    upload,
    validate,
    reset,
    isIdle: state.status === 'idle',
    isUploading:
      state.status === 'preparing' ||
      state.status === 'uploading' ||
      state.status === 'confirming',
    isCompleted: state.status === 'completed',
    isError: state.status === 'error',
  };
};

export default useImageUpload;