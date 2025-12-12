// src/shared/hooks/useCopyToClipboard.ts
import { useState, useCallback } from 'react';
import { copyToClipboard } from '../utils/helpers';

interface UseCopyToClipboardReturn {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
  error: Error | null;
  reset: () => void;
}

export function useCopyToClipboard(
  resetTimeout: number = 2000
): UseCopyToClipboardReturn {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        const success = await copyToClipboard(text);
        
        if (success) {
          setCopied(true);
          setError(null);

          // Reset after timeout
          if (resetTimeout > 0) {
            setTimeout(() => {
              setCopied(false);
            }, resetTimeout);
          }

          return true;
        } else {
          throw new Error('Failed to copy to clipboard');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setCopied(false);
        return false;
      }
    },
    [resetTimeout]
  );

  return { copy, copied, error, reset };
}

export default useCopyToClipboard;