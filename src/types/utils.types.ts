// src/types/utils.types.ts

/**
 * Утилиты типов
 */

// ============================================================================
// GENERIC TYPES
// ============================================================================

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

export type AsyncFunction<T = void> = (...args: unknown[]) => Promise<T>
export type VoidFunction = () => void

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
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

export interface FormField<T = unknown> {
  value: T
  error: string | null
  touched: boolean
  dirty: boolean
}

export interface FormState<T extends Record<string, unknown>> {
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

export type ValidationRule<T = unknown> = (value: T) => string | null | Promise<string | null>

export interface ValidationRules<T = unknown> {
  [K: string]: ValidationRule<T> | ValidationRule<T>[]
}

// ============================================================================
// ROUTE TYPES
// ============================================================================

export interface RouteMeta {
  requiresAuth?: boolean
  requiresGuest?: boolean
  title?: string
  layout?: 'default' | 'auth' | 'guest'
  roles?: string[]
  permissions?: string[]
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

// ✅ ДОБАВЛЕНО: Полезные утилиты

/**
 * Делает указанные ключи обязательными
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Делает указанные ключи опциональными
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Readonly для вложенных объектов
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * Извлекает тип элемента массива
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never

/**
 * Извлекает тип Promise
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T

/**
 * Union to Intersection
 */
export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never

/**
 * Strict Omit (ошибка если ключ не существует)
 */
export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

/**
 * Strict Pick (ошибка если ключ не существует)
 */
export type StrictPick<T, K extends keyof T> = Pick<T, K>
