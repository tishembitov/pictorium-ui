/**
 * useFormValidation Composable
 *
 * Валидация форм
 */

import { ref, type Ref } from 'vue'
import type { ValidationRule } from '@/types/utils.types'
import {
  validateUsername,
  validateEmail,
  validateUrl,
  validatePinTitle,
  validatePinDescription,
  validateComment,
  validateTag,
  getUsernameError,
  getEmailError,
  getUrlError,
  getPinTitleError,
  getPinDescriptionError,
  getCommentError,
  getTagError,
} from '@/utils/validators'

export interface ValidationRules {
  [key: string]: ValidationRule | ValidationRule[]
}

/**
 * useFormValidation
 *
 * @example
 * ```ts
 * const { validateField, validateForm } = useFormValidation({
 *   username: (value) => {
 *     if (!value) return 'Username is required'
 *     return getUsernameError(value)
 *   },
 *   email: [
 *     required('Email is required'),
 *     email('Invalid email format')
 *   ]
 * })
 *
 * const error = await validateField('username', 'ab')
 * const errors = await validateForm({ username: 'ab', email: 'invalid' })
 * ```
 */
export function useFormValidation(rules: ValidationRules = {}) {
  const isValidating = ref(false)

  const validateField = async (field: string, value: any): Promise<string | null> => {
    const fieldRules = rules[field]
    if (!fieldRules) return null

    const rulesToApply = Array.isArray(fieldRules) ? fieldRules : [fieldRules]

    for (const rule of rulesToApply) {
      const error = await rule(value)
      if (error) return error
    }

    return null
  }

  const validateForm = async (values: Record<string, any>): Promise<Record<string, string>> => {
    isValidating.value = true
    const errors: Record<string, string> = {}

    try {
      await Promise.all(
        Object.keys(rules).map(async (field) => {
          const error = await validateField(field, values[field])
          if (error) {
            errors[field] = error
          }
        }),
      )
    } finally {
      isValidating.value = false
    }

    return errors
  }

  return {
    isValidating,
    validateField,
    validateForm,
  }
}

/**
 * Validation rule factories
 */

/**
 * Required validator
 */
export function required(message = 'This field is required'): ValidationRule {
  return (value: any) => {
    if (value === null || value === undefined) return message
    if (typeof value === 'string' && !value.trim()) return message
    if (Array.isArray(value) && value.length === 0) return message
    return null
  }
}

/**
 * Min length validator
 */
export function minLength(min: number, message?: string): ValidationRule {
  return (value: any) => {
    if (!value) return null
    if (typeof value === 'string' && value.length < min) {
      return message || `Must be at least ${min} characters`
    }
    if (Array.isArray(value) && value.length < min) {
      return message || `Must have at least ${min} items`
    }
    return null
  }
}

/**
 * Max length validator
 */
export function maxLength(max: number, message?: string): ValidationRule {
  return (value: any) => {
    if (!value) return null
    if (typeof value === 'string' && value.length > max) {
      return message || `Must be at most ${max} characters`
    }
    if (Array.isArray(value) && value.length > max) {
      return message || `Must have at most ${max} items`
    }
    return null
  }
}

/**
 * Email validator
 */
export function email(message = 'Invalid email format'): ValidationRule {
  return (value: any) => {
    if (!value) return null
    if (!validateEmail(value)) return message
    return null
  }
}

/**
 * URL validator
 */
export function url(message = 'Invalid URL format'): ValidationRule {
  return (value: any) => {
    if (!value) return null
    if (!validateUrl(value)) return message
    return null
  }
}

/**
 * Pattern validator
 */
export function pattern(regex: RegExp, message = 'Invalid format'): ValidationRule {
  return (value: any) => {
    if (!value) return null
    if (!regex.test(value)) return message
    return null
  }
}

/**
 * Min value validator
 */
export function min(minValue: number, message?: string): ValidationRule {
  return (value: any) => {
    if (value === null || value === undefined) return null
    if (Number(value) < minValue) {
      return message || `Must be at least ${minValue}`
    }
    return null
  }
}

/**
 * Max value validator
 */
export function max(maxValue: number, message?: string): ValidationRule {
  return (value: any) => {
    if (value === null || value === undefined) return null
    if (Number(value) > maxValue) {
      return message || `Must be at most ${maxValue}`
    }
    return null
  }
}

/**
 * Match validator (для подтверждения пароля)
 */
export function match(fieldName: string, message?: string): ValidationRule {
  return (value: any, formValues?: Record<string, any>) => {
    if (!value || !formValues) return null
    if (value !== formValues[fieldName]) {
      return message || `Must match ${fieldName}`
    }
    return null
  }
}

/**
 * Custom async validator
 */
export function asyncValidator(
  fn: (value: any) => Promise<boolean>,
  message = 'Validation failed',
): ValidationRule {
  return async (value: any) => {
    const isValid = await fn(value)
    return isValid ? null : message
  }
}

/**
 * Предопределенные валидаторы для приложения
 */

export const usernameValidator = [
  required('Username is required'),
  minLength(3, 'Username must be at least 3 characters'),
  maxLength(30, 'Username must be at most 30 characters'),
  pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
]

export const emailValidator = [required('Email is required'), email('Invalid email format')]

export const passwordValidator = [
  required('Password is required'),
  minLength(8, 'Password must be at least 8 characters'),
]

export const pinTitleValidator = [maxLength(200, 'Title must be at most 200 characters')]

export const pinDescriptionValidator = [
  maxLength(400, 'Description must be at most 400 characters'),
]

export const commentValidator = [
  required('Comment cannot be empty'),
  maxLength(400, 'Comment must be at most 400 characters'),
]

export const tagValidator = [
  required('Tag cannot be empty'),
  maxLength(100, 'Tag must be at most 100 characters'),
]

export const boardTitleValidator = [
  required('Board title is required'),
  maxLength(200, 'Title must be at most 200 characters'),
]

/**
 * useValidators
 *
 * Helper для использования предопределенных валидаторов
 *
 * @example
 * ```ts
 * const validators = useValidators()
 *
 * const form = useForm({
 *   initialValues: { username: '', email: '' },
 *   validationRules: {
 *     username: validators.username,
 *     email: validators.email
 *   }
 * })
 * ```
 */
export function useValidators() {
  return {
    // Basic
    required,
    minLength,
    maxLength,
    email,
    url,
    pattern,
    min,
    max,
    match,
    asyncValidator,

    // Predefined
    username: usernameValidator,
    emailField: emailValidator,
    password: passwordValidator,
    pinTitle: pinTitleValidator,
    pinDescription: pinDescriptionValidator,
    comment: commentValidator,
    tag: tagValidator,
    boardTitle: boardTitleValidator,
  }
}
