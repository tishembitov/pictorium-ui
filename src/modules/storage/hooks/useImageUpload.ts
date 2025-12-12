// src/modules/storage/hooks/useImageUpload.ts

import { useState, useCallback, useRef } from 'react';
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
  upload: (file: File, options?: Omit<UploadOptions, 'signal'>) => Promise<UploadResult>;
  validate: (file: File) => FileValidationResult;
  reset: () => void;
  cancel: () => void;
  isIdle: boolean;
  isUploading: boolean;
  isCompleted: boolean;
  isError: boolean;
  isCancelled: boolean;
}

const initialState: UseImageUploadState = {
  status: 'idle',
  progress: { loaded: 0, total: 0, percentage: 0 },
  result: null,
  error: null,
};

/**
 * Comprehensive hook for image upload with cancellation support
 */
export const useImageUpload = (): UseImageUploadReturn => {
  const [state, setState] = useState<UseImageUploadState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const validate = useCallback((file: File): FileValidationResult => {
    return validateImageFile(file);
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setState((prev) => ({
        ...prev,
        status: 'cancelled',
        error: 'Upload cancelled',
      }));
    }
  }, []);

  const upload = useCallback(
    async (file: File, options: Omit<UploadOptions, 'signal'> = {}): Promise<UploadResult> => {
      // Cancel any existing upload
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

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
          signal,
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

        abortControllerRef.current = null;
        return result;
      } catch (error) {
        const isCancelled = error instanceof Error && error.name === 'AbortError';
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        setState((prev) => ({
          ...prev,
          status: isCancelled ? 'cancelled' : 'error',
          error: errorMessage,
        }));
        
        abortControllerRef.current = null;
        throw error;
      }
    },
    [validate]
  );

  const reset = useCallback(() => {
    cancel();
    setState(initialState);
  }, [cancel]);

  return {
    ...state,
    upload,
    validate,
    reset,
    cancel,
    isIdle: state.status === 'idle',
    isUploading:
      state.status === 'preparing' ||
      state.status === 'uploading' ||
      state.status === 'confirming',
    isCompleted: state.status === 'completed',
    isError: state.status === 'error',
    isCancelled: state.status === 'cancelled',
  };
};

export default useImageUpload;