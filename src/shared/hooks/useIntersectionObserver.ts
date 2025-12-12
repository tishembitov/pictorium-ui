// src/shared/hooks/useIntersectionObserver.ts
import { useState, useEffect, useRef, type RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
  enabled?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: RefObject<HTMLDivElement | null>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
    enabled = true,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const frozen = useRef(false);

  const isIntersecting = entry?.isIntersecting ?? false;

  useEffect(() => {
    if (freezeOnceVisible && isIntersecting) {
      frozen.current = true;
    }
  }, [freezeOnceVisible, isIntersecting]);

  useEffect(() => {
    const node = ref.current;
    
    if (!enabled || !node || frozen.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        if (observerEntry) {
          setEntry(observerEntry);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [enabled, threshold, root, rootMargin]);

  return { ref, isIntersecting, entry };
}

/**
 * Hook for infinite scroll detection
 */
export function useInfiniteScroll(
  callback: () => void,
  options: Omit<UseIntersectionObserverOptions, 'freezeOnceVisible'> & {
    hasMore?: boolean;
    isLoading?: boolean;
  } = {}
): RefObject<HTMLDivElement | null> {
  const { hasMore = true, isLoading = false, ...observerOptions } = options;
  
  const { ref, isIntersecting } = useIntersectionObserver({
    ...observerOptions,
    enabled: hasMore && !isLoading,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      callback();
    }
  }, [isIntersecting, hasMore, isLoading, callback]);

  return ref;
}

export default useIntersectionObserver;