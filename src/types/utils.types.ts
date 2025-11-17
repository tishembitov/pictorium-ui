/**
 * Утилиты типов
 */

// ============================================================================
// GENERIC TYPES
// ============================================================================

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

export type AsyncFunction<T = void> = (...args: any[]) => Promise<T>
export type VoidFunction = () => void

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  status?: number
  errors?: Record<string, string[]>
}

export interface PaginationParams {
  page: number
  size: number
  sort?: string[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormField<T = any> {
  value: T
  error: string | null
  touched: boolean
  dirty: boolean
}

export interface FormState<T extends Record<string, any>> {
  fields: {
    [K in keyof T]: FormField<T[K]>
  }
  isValid: boolean
  isSubmitting: boolean
  errors: Partial<Record<keyof T, string>>
}

// ============================================================================
// FILE TYPES
// ============================================================================

export interface FileWithPreview extends File {
  preview?: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export type ValidationRule<T = any> = (value: T) => string | null | Promise<string | null>

export interface ValidationRules<T extends Record<string, any>> {
  [K: string]: ValidationRule | ValidationRule[]
}

// ============================================================================
// ROUTE TYPES
// ============================================================================

export interface RouteMeta {
  requiresAuth?: boolean
  requiresGuest?: boolean
  title?: string
  layout?: 'default' | 'auth' | 'guest'
}

// ============================================================================
// HELPERS
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

export type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P]
}

export type OmitByType<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P]
}
