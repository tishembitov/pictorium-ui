// src/shared/hooks/useLocalStorage.ts

import { useCallback, useSyncExternalStore } from 'react';

type SetValue<T> = T | ((prev: T) => T);

// Storage event listeners management
const storageListeners = new Map<string, Set<() => void>>();

const notifyListeners = (key: string) => {
  storageListeners.get(key)?.forEach(listener => listener());
};

// Helper to safely parse JSON
const safeJsonParse = <T>(json: string | null, fallback: T): T => {
  if (json === null) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

// Helper to get value from localStorage
const getStorageValue = <T>(key: string, initialValue: T): T => {
  if (globalThis.window === undefined) {
    return initialValue;
  }

  try {
    const item = globalThis.localStorage.getItem(key);
    return item === null ? initialValue : safeJsonParse<T>(item, initialValue);
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return initialValue;
  }
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // Subscribe function for useSyncExternalStore
  const subscribe = useCallback((callback: () => void) => {
    // Add to internal listeners
    if (!storageListeners.has(key)) {
      storageListeners.set(key, new Set());
    }
    storageListeners.get(key)!.add(callback);

    // Listen for storage events from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        callback();
      }
    };
    
    globalThis.addEventListener('storage', handleStorageChange);
    
    return () => {
      const listeners = storageListeners.get(key);
      listeners?.delete(callback);
      
      // ✅ ИСПРАВЛЕНИЕ: Очистка пустых Set для предотвращения утечки памяти
      if (listeners?.size === 0) {
        storageListeners.delete(key);
      }
      
      globalThis.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  // Get snapshot from localStorage
  const getSnapshot = useCallback((): T => {
    return getStorageValue(key, initialValue);
  }, [key, initialValue]);

  // Server snapshot (for SSR)
  const getServerSnapshot = useCallback((): T => {
    return initialValue;
  }, [initialValue]);

  // Use useSyncExternalStore for reactive updates
  const storedValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  // Set value to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        const currentValue = getStorageValue(key, initialValue);
        const valueToStore = typeof value === 'function' 
          ? (value as (prev: T) => T)(currentValue) 
          : value;
        
        if (globalThis.window !== undefined) {
          globalThis.localStorage.setItem(key, JSON.stringify(valueToStore));
          // Notify listeners in the same tab
          notifyListeners(key);
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, initialValue]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      if (globalThis.window !== undefined) {
        globalThis.localStorage.removeItem(key);
        // Notify listeners in the same tab
        notifyListeners(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;