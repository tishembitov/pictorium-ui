// Delay/sleep helper
export const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  
  // Debounce function
  export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => func(...args), wait);
    };
  };
  
  // Throttle function
  export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  };
  
  // Generate unique ID
  export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };
  
  // Deep clone object
  export const deepClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  };
  
  // Check if object is empty
  export const isEmpty = (obj: object): boolean => {
    return Object.keys(obj).length === 0;
  };
  
  // Pick specific keys from object
  export const pick = <T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  };
  
  // Omit specific keys from object
  export const omit = <T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result as Omit<T, K>;
  };
  
  // Remove undefined/null values from object
  export const compact = <T extends object>(obj: T): Partial<T> => {
    const result = {} as Partial<T>;
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        (result as any)[key] = value;
      }
    });
    return result;
  };
  
  // Group array by key
  export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
  };
  
  // Get unique values from array
  export const unique = <T>(array: T[]): T[] => {
    return [...new Set(array)];
  };
  
  // Get unique values by key
  export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  };
  
  // Chunk array into smaller arrays
  export const chunk = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };
  
  // Shuffle array
  export const shuffle = <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  
  // Safe JSON parse
  export const safeJsonParse = <T>(json: string, fallback: T): T => {
    try {
      return JSON.parse(json) as T;
    } catch {
      return fallback;
    }
  };
  
  // Local storage helpers
  export const storage = {
    get: <T>(key: string, fallback: T): T => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch {
        return fallback;
      }
    },
    
    set: <T>(key: string, value: T): void => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    },
    
    remove: (key: string): void => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Failed to remove from localStorage:', error);
      }
    },
  };
  
  // Copy to clipboard
  export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };
  
  // Check if running on client
  export const isClient = typeof window !== 'undefined';
  
  // Check if running on server
  export const isServer = !isClient;
  
  // Get window dimensions
  export const getWindowDimensions = () => {
    if (!isClient) return { width: 0, height: 0 };
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  };
  
  // Scroll to top
  export const scrollToTop = (smooth = true): void => {
    if (isClient) {
      window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };
  
  // Class name helper (simple version)
  export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
    return classes.filter(Boolean).join(' ');
  };