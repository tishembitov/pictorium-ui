/**
 * useFormErrors Composable
 *
 * Управление ошибками форм
 */

import { ref, computed, type Ref } from 'vue'

/**
 * useFormErrors
 *
 * @example
 * ```ts
 * const {
 *   errors,
 *   setFieldError,
 *   clearFieldError,
 *   hasErrors
 * } = useFormErrors<{ username: string; email: string }>()
 *
 * setFieldError('username', 'Username is required')
 * setFieldError('email', 'Invalid email')
 *
 * console.log(hasErrors.value) // true
 *
 * clearFieldError('username')
 * clearAllErrors()
 * ```
 */
export function useFormErrors<T extends Record<string, any>>() {
  const errors = ref<Partial<Record<keyof T, string>>>({}) as Ref<Partial<Record<keyof T, string>>>

  const hasErrors = computed(() => Object.keys(errors.value).length > 0)

  const getFieldError = <K extends keyof T>(field: K): string | undefined => {
    return errors.value[field]
  }

  const setFieldError = <K extends keyof T>(field: K, error: string) => {
    errors.value[field] = error
  }

  const clearFieldError = <K extends keyof T>(field: K) => {
    delete errors.value[field]
  }

  const clearAllErrors = () => {
    errors.value = {}
  }

  const setErrors = (newErrors: Partial<Record<keyof T, string>>) => {
    errors.value = { ...newErrors }
  }

  const hasFieldError = <K extends keyof T>(field: K): boolean => {
    return !!errors.value[field]
  }

  return {
    errors,
    hasErrors,
    getFieldError,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setErrors,
    hasFieldError,
  }
}

/**
 * useServerErrors
 *
 * Обработка серверных ошибок валидации
 *
 * @example
 * ```ts
 * const { handleServerError, clearServerErrors } = useServerErrors(form)
 *
 * try {
 *   await createUser(values)
 * } catch (error) {
 *   handleServerError(error)
 * }
 * ```
 */
export function useServerErrors<T extends Record<string, any>>(
  formErrors: ReturnType<typeof useFormErrors<T>>,
) {
  const handleServerError = (error: any) => {
    // Axios error with validation errors
    if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors as Record<string, string[]>

      Object.entries(validationErrors).forEach(([field, messages]) => {
        if (messages && messages.length > 0) {
          formErrors.setFieldError(field as keyof T, messages[0])
        }
      })
    }
    // Single error message
    else if (error.response?.data?.message) {
      // Set as general error (можно добавить поле 'general')
      formErrors.setFieldError('general' as keyof T, error.response.data.message)
    }
    // Generic error
    else {
      formErrors.setFieldError('general' as keyof T, 'An unexpected error occurred')
    }
  }

  const clearServerErrors = () => {
    formErrors.clearAllErrors()
  }

  return {
    handleServerError,
    clearServerErrors,
  }
}

/**
 * useFieldError
 *
 * Hook для одного поля (для компонентов)
 *
 * @example
 * ```ts
 * // В компоненте Input
 * const { error, hasError, setError, clearError } = useFieldError()
 * ```
 */
export function useFieldError() {
  const error = ref<string | null>(null)

  const hasError = computed(() => !!error.value)

  const setError = (message: string) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  return {
    error,
    hasError,
    setError,
    clearError,
  }
}

/**
 * useFormErrorSummary
 *
 * Суммарное отображение ошибок формы
 *
 * @example
 * ```ts
 * const { errorList, errorCount } = useFormErrorSummary(form.errors)
 * ```
 */
export function useFormErrorSummary<T extends Record<string, any>>(
  errors: Ref<Partial<Record<keyof T, string>>>,
) {
  const errorList = computed(() => {
    return Object.entries(errors.value).map(([field, message]) => ({
      field,
      message,
    }))
  })

  const errorCount = computed(() => errorList.value.length)

  const firstError = computed(() => errorList.value[0])

  const errorMessages = computed(() => errorList.value.map((e) => e.message))

  return {
    errorList,
    errorCount,
    firstError,
    errorMessages,
  }
}
