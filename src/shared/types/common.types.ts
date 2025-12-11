// Base entity with common fields
export interface BaseEntity {
    id: string;
    createdAt?: string;
    updatedAt?: string;
  }
  
  // UUID type alias for clarity
  export type UUID = string;
  
  // Nullable type helper
  export type Nullable<T> = T | null;
  
  // Optional type helper
  export type Optional<T> = T | undefined;
  
  // Deep partial type
  export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  };
  
  // API Response wrapper
  export interface ApiResponse<T> {
    data: T;
    status: number;
    message?: string;
  }
  
  // Error response from API
  export interface ApiError {
    status: number;
    message: string;
    errors?: Record<string, string[]>;
    timestamp?: string;
    path?: string;
  }
  
  // Loading state type
  export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
  
  // Async state for data fetching
  export interface AsyncState<T> {
    data: T | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  }
  
  // Action result type
  export interface ActionResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
  }
  
  // Select option type
  export interface SelectOption<T = string> {
    label: string;
    value: T;
    disabled?: boolean;
  }
  
  // Key-value pair
  export interface KeyValue<K = string, V = string> {
    key: K;
    value: V;
  }
  
  // Date range
  export interface DateRange {
    from: Date | null;
    to: Date | null;
  }
  
  // Coordinates
  export interface Coordinates {
    x: number;
    y: number;
  }
  
  // Dimensions
  export interface Dimensions {
    width: number;
    height: number;
  }
  
  // File info
  export interface FileInfo {
    name: string;
    size: number;
    type: string;
    lastModified?: number;
  }