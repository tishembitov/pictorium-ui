// src/shared/hooks/useDebounce.ts

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Hook that debounces a value
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that returns a debounced callback
 * Uses useRef to avoid stale closures and unnecessary re-renders
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Debounced function
 */
export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update callback ref on each render to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}

/**
 * Hook that returns debounced value and a pending state
 * Useful for showing loading indicators during debounce
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Object with debouncedValue and isPending state
 */
export function useDebounceWithPending<T>(
  value: T,
  delay: number = 300
): { debouncedValue: T; isPending: boolean } {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate isPending based on current vs debounced value
  // This avoids setState in effect
  const isPending = value !== debouncedValue;

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return { debouncedValue, isPending };
}

/**
 * Hook for debounced search with loading state
 * @param searchFn - Search function to call
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Object with search function, isSearching state, and cancel function
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300
): {
  search: (query: string) => void;
  isSearching: boolean;
  cancel: () => void;
} {
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSearching(false);
  }, []);

  const search = useCallback((query: string) => {
    // Cancel previous search
    cancel();

    if (!query.trim()) {
      return;
    }

    setIsSearching(true);

    timeoutRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();
      
      try {
        await searchFn(query);
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search error:', error);
        }
      } finally {
        setIsSearching(false);
      }
    }, delay);
  }, [searchFn, delay, cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return { search, isSearching, cancel };
}

/**
 * Hook that provides immediate value and debounced value
 * Useful for controlled inputs with debounced API calls
 * @param initialValue - Initial value
 * @param delay - Delay in milliseconds (default: 300)
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): {
  value: T;
  debouncedValue: T;
  setValue: (value: T) => void;
  isPending: boolean;
  flush: () => void;
} {
  const [currentValue, setCurrentValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate isPending without setState
  const isPending = currentValue !== debouncedValue;

  const setValue = useCallback((newValue: T) => {
    setCurrentValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  }, [delay]);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDebouncedValue(currentValue);
  }, [currentValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useMemo(() => ({
    value: currentValue,
    debouncedValue,
    setValue,
    isPending,
    flush,
  }), [currentValue, debouncedValue, setValue, isPending, flush]);
}

export default useDebounce;