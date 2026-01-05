// src/modules/pin/hooks/useScrollToComments.ts

import { useCallback, useRef } from 'react';

/**
 * Хук для скролла к секции комментариев.
 * Возвращает ref для привязки к элементу и функцию скролла.
 */
export const useScrollToComments = () => {
  const commentsRef = useRef<HTMLDivElement>(null);

  const scrollToComments = useCallback(() => {
    commentsRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, []);

  return { 
    commentsRef, 
    scrollToComments 
  };
};

export default useScrollToComments;