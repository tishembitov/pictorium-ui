// src/modules/storage/store/uploadQueueStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UploadItem, UploadStatus, UploadProgress } from '../types/storage.types';
import { generateId } from '@/shared/utils/helpers';

interface UploadQueueState {
  items: UploadItem[];
  isProcessing: boolean;
  concurrentUploads: number;
  maxConcurrentUploads: number;
}

interface UploadQueueActions {
  // Queue management
  addToQueue: (file: File, options?: Partial<UploadItem>) => string;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  clearCompleted: () => void;
  clearErrors: () => void;
  
  // Item updates
  updateItem: (id: string, updates: Partial<UploadItem>) => void;
  setItemStatus: (id: string, status: UploadStatus) => void;
  setItemProgress: (id: string, progress: UploadProgress) => void;
  setItemError: (id: string, error: string) => void;
  setItemResult: (id: string, result: {
    imageId: string;
    imageUrl?: string;
    thumbnailId?: string;
    thumbnailUrl?: string;
  }) => void;
  
  // Processing
  setProcessing: (isProcessing: boolean) => void;
  incrementConcurrent: () => void;
  decrementConcurrent: () => void;
  
  // Retry
  retryItem: (id: string) => void;
  retryAllErrors: () => void;
  
  // Getters
  getItem: (id: string) => UploadItem | undefined;
  getPendingItems: () => UploadItem[];
  getUploadingItems: () => UploadItem[];
  getCompletedItems: () => UploadItem[];
  getErrorItems: () => UploadItem[];
}

type UploadQueueStore = UploadQueueState & UploadQueueActions;

const initialState: UploadQueueState = {
  items: [],
  isProcessing: false,
  concurrentUploads: 0,
  maxConcurrentUploads: 3,
};

export const useUploadQueueStore = create<UploadQueueStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      addToQueue: (file, options = {}) => {
        const id = generateId();
        const newItem: UploadItem = {
          id,
          file,
          status: 'idle',
          progress: { loaded: 0, total: file.size, percentage: 0 },
          category: options.category,
          generateThumbnail: options.generateThumbnail,
          thumbnailWidth: options.thumbnailWidth,
          thumbnailHeight: options.thumbnailHeight,
          ...options,
        };
        
        set(
          (state) => ({ items: [...state.items, newItem] }),
          false,
          'addToQueue'
        );
        
        return id;
      },

      removeFromQueue: (id) => {
        set(
          (state) => ({ items: state.items.filter((item) => item.id !== id) }),
          false,
          'removeFromQueue'
        );
      },

      clearQueue: () => {
        set({ items: [] }, false, 'clearQueue');
      },

      clearCompleted: () => {
        set(
          (state) => ({
            items: state.items.filter((item) => item.status !== 'completed'),
          }),
          false,
          'clearCompleted'
        );
      },

      clearErrors: () => {
        set(
          (state) => ({
            items: state.items.filter((item) => item.status !== 'error'),
          }),
          false,
          'clearErrors'
        );
      },

      updateItem: (id, updates) => {
        set(
          (state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, ...updates } : item
            ),
          }),
          false,
          'updateItem'
        );
      },

      setItemStatus: (id, status) => {
        const updates: Partial<UploadItem> = { status };
        
        if (status === 'uploading' || status === 'preparing') {
          updates.startedAt = Date.now();
        }
        
        if (status === 'completed') {
          updates.completedAt = Date.now();
        }
        
        get().updateItem(id, updates);
      },

      setItemProgress: (id, progress) => {
        get().updateItem(id, { progress });
      },

      setItemError: (id, error) => {
        get().updateItem(id, { status: 'error', error });
      },

      setItemResult: (id, result) => {
        get().updateItem(id, {
          status: 'completed',
          imageId: result.imageId,
          imageUrl: result.imageUrl,
          thumbnailId: result.thumbnailId,
          thumbnailUrl: result.thumbnailUrl,
          completedAt: Date.now(),
        });
      },

      setProcessing: (isProcessing) => {
        set({ isProcessing }, false, 'setProcessing');
      },

      incrementConcurrent: () => {
        set(
          (state) => ({ concurrentUploads: state.concurrentUploads + 1 }),
          false,
          'incrementConcurrent'
        );
      },

      decrementConcurrent: () => {
        set(
          (state) => ({
            concurrentUploads: Math.max(0, state.concurrentUploads - 1),
          }),
          false,
          'decrementConcurrent'
        );
      },

      retryItem: (id) => {
        get().updateItem(id, {
          status: 'idle',
          error: undefined,
          progress: { loaded: 0, total: 0, percentage: 0 },
        });
      },

      retryAllErrors: () => {
        set(
          (state) => ({
            items: state.items.map((item) =>
              item.status === 'error'
                ? {
                    ...item,
                    status: 'idle' as UploadStatus,
                    error: undefined,
                    progress: { loaded: 0, total: item.file.size, percentage: 0 },
                  }
                : item
            ),
          }),
          false,
          'retryAllErrors'
        );
      },

      getItem: (id) => {
        return get().items.find((item) => item.id === id);
      },

      getPendingItems: () => {
        return get().items.filter((item) => item.status === 'idle');
      },

      getUploadingItems: () => {
        return get().items.filter(
          (item) =>
            item.status === 'preparing' ||
            item.status === 'uploading' ||
            item.status === 'confirming'
        );
      },

      getCompletedItems: () => {
        return get().items.filter((item) => item.status === 'completed');
      },

      getErrorItems: () => {
        return get().items.filter((item) => item.status === 'error');
      },
    }),
    { name: 'UploadQueueStore' }
  )
);

// Selectors
export const selectUploadItems = (state: UploadQueueStore) => state.items;
export const selectIsProcessing = (state: UploadQueueStore) => state.isProcessing;
export const selectConcurrentUploads = (state: UploadQueueStore) => state.concurrentUploads;
export const selectPendingCount = (state: UploadQueueStore) => 
  state.items.filter(i => i.status === 'idle').length;
export const selectUploadingCount = (state: UploadQueueStore) => 
  state.items.filter(i => ['preparing', 'uploading', 'confirming'].includes(i.status)).length;
export const selectCompletedCount = (state: UploadQueueStore) => 
  state.items.filter(i => i.status === 'completed').length;
export const selectErrorCount = (state: UploadQueueStore) => 
  state.items.filter(i => i.status === 'error').length;

export default useUploadQueueStore;