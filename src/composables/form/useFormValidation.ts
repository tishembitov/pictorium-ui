// src/composables/form/useFormValidation.ts
/**
 * useFormValidation - Form validation
 *
 * Использует validators из utils/validators.ts
 * НЕ дублирует - создает reactive validation flow
 */

import { ref } from 'vue'
import {
  getUsernameError,
  getEmailError,
  getUrlError,
  getPinTitleError,
  getPinDescriptionError,
  getCommentError,
  getTagError,
} from '@/utils/validators'

// ============================================================================
// TYPES
// ============================================================================

export type ValidationRule<T = unknown> = (value: T) => string | null | Promise<string | null>

export type ValidationRules<T extends Record<string, unknown>> = Partial<{
  [K in keyof T]: ValidationRule<T[K]> | ValidationRule<T[K]>[]
}>

// ============================================================================
// MAIN COMPOSABLE
// ============================================================================

export function useFormValidation<T extends Record<string, unknown>>(
  rules: ValidationRules<T> = {},
) {
  const isValidating = ref(false)

  const validateField = async (field: string, value: unknown): Promise<string | null> => {
    const fieldRules = rules[field as keyof T]
    if (!fieldRules) return null

    const rulesToApply = Array.isArray(fieldRules) ? fieldRules : [fieldRules]

    for (const rule of rulesToApply) {
      const error = await rule(value as T[keyof T])
      if (error) return error
    }

    return null
  }

  const validateAll = async (values: T): Promise<Partial<Record<keyof T, string>>> => {
    isValidating.value = true
    const errors: Partial<Record<keyof T, string>> = {}

    try {
      await Promise.all(
        Object.keys(rules).map(async (field) => {
          const error = await validateField(field, values[field as keyof T])
          if (error) {
            errors[field as keyof T] = error
          }
        }),
      )
    } finally {
      isValidating.value = false
    }

    return errors
  }

  return { isValidating, validateField, validateAll }
}

// ============================================================================
// VALIDATION RULE FACTORIES
// ============================================================================

export const required =
  (message = 'This field is required'): ValidationRule =>
  (value) => {
    if (value === null || value === undefined) return message
    if (typeof value === 'string' && !value.trim()) return message
    if (Array.isArray(value) && value.length === 0) return message
    return null
  }

export const minLength =
  (min: number, message?: string): ValidationRule<string> =>
  (value) => {
    if (!value) return null
    if (value.length < min) return message || `Must be at least ${min} characters`
    return null
  }

export const maxLength =
  (max: number, message?: string): ValidationRule<string> =>
  (value) => {
    if (!value) return null
    if (value.length > max) return message || `Must be at most ${max} characters`
    return null
  }

export const pattern =
  (regex: RegExp, message = 'Invalid format'): ValidationRule<string> =>
  (value) => {
    if (!value) return null
    if (!regex.test(value)) return message
    return null
  }

export const email =
  (message = 'Invalid email'): ValidationRule<string> =>
  (value) =>
    value ? getEmailError(value) : null

export const url =
  (message = 'Invalid URL'): ValidationRule<string> =>
  (value) =>
    value ? getUrlError(value) : null

export const boardTitleValidator: ValidationRule<string> = (value) => {
  if (!value?.trim()) {
    return 'Board name is required'
  }
  if (value.trim().length < 1) {
    return 'Board name must be at least 1 character'
  }
  if (value.length > 50) {
    return 'Board name must be less than 50 characters'
  }
  return null
}

// ============================================================================
// PREDEFINED VALIDATORS (используют utils/validators.ts)
// ============================================================================

export const validators = {
  // Basic factories
  required,
  minLength,
  maxLength,
  pattern,
  email,
  url,

  // App-specific (делегируют в utils/validators.ts)
  username: (value: string) => getUsernameError(value),
  pinTitle: (value: string) => getPinTitleError(value),
  pinDescription: (value: string) => getPinDescriptionError(value),
  comment: (value: string) => getCommentError(value),
  tag: (value: string) => getTagError(value),

  // Board validators
  boardTitle: boardTitleValidator,
  boardTitleField: [required('Board name is required'), boardTitleValidator],

  // Composite validators
  usernameField: [required('Username is required'), (value: string) => getUsernameError(value)],
  emailField: [required('Email is required'), email()],
  passwordField: [
    required('Password is required'),
    minLength(8, 'Password must be at least 8 characters'),
  ],
}
