/**
 * useForm Composable
 *
 * Управление состоянием форм
 */

import { ref, reactive, computed, watch, type Ref, type UnwrapRef } from 'vue'
import { useFormValidation } from './useFormValidation'
import { useFormErrors } from './useFormErrors'
import type { ValidationRule } from '@/types/utils.types'

export interface FormField<T = any> {
  value: T
  error: string | null
  touched: boolean
  dirty: boolean
}

export interface UseFormOptions<T extends Record<string, any>> {
  /**
   * Начальные значения
   */
  initialValues: T

  /**
   * Правила валидации
   */
  validationRules?: Partial<Record<keyof T, ValidationRule | ValidationRule[]>>

  /**
   * Валидировать при изменении
   * @default true
   */
  validateOnChange?: boolean

  /**
   * Валидировать при blur
   * @default true
   */
  validateOnBlur?: boolean

  /**
   * Callback при успешной отправке
   */
  onSubmit?: (values: T) => void | Promise<void>

  /**
   * Callback при ошибке
   */
  onError?: (errors: Record<keyof T, string>) => void
}

/**
 * useForm
 *
 * @example
 * ```ts
 * const {
 *   values,
 *   errors,
 *   isValid,
 *   handleSubmit,
 *   setFieldValue,
 *   setFieldError
 * } = useForm({
 *   initialValues: {
 *     username: '',
 *     email: '',
 *     password: ''
 *   },
 *   validationRules: {
 *     username: (value) => {
 *       if (!value) return 'Username is required'
 *       if (value.length < 3) return 'Username must be at least 3 characters'
 *       return null
 *     },
 *     email: (value) => {
 *       if (!value) return 'Email is required'
 *       if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email'
 *       return null
 *     }
 *   },
 *   onSubmit: async (values) => {
 *     await createUser(values)
 *   }
 * })
 * ```
 */
export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>) {
  const {
    initialValues,
    validationRules = {},
    validateOnChange = true,
    validateOnBlur = true,
    onSubmit,
    onError,
  } = options

  // Form state
  const values = reactive({ ...initialValues }) as UnwrapRef<T>
  const touched = reactive(
    Object.keys(initialValues).reduce(
      (acc, key) => {
        acc[key as keyof T] = false
        return acc
      },
      {} as Record<keyof T, boolean>,
    ),
  )
  const dirty = reactive(
    Object.keys(initialValues).reduce(
      (acc, key) => {
        acc[key as keyof T] = false
        return acc
      },
      {} as Record<keyof T, boolean>,
    ),
  )

  const { errors, setFieldError, clearFieldError, clearAllErrors, hasErrors } = useFormErrors<T>()
  const { validateField, validateForm } = useFormValidation(validationRules)

  const isSubmitting = ref(false)
  const submitCount = ref(0)

  // Computed
  const isValid = computed(() => !hasErrors.value)
  const isDirty = computed(() => Object.values(dirty).some(Boolean))
  const isTouched = computed(() => Object.values(touched).some(Boolean))

  // Field methods
  const setFieldValue = <K extends keyof T>(field: K, value: T[K]) => {
    values[field] = value as UnwrapRef<T>[K]
    dirty[field] = true

    if (validateOnChange) {
      validateFieldWithRules(field)
    }
  }

  const setFieldTouched = <K extends keyof T>(field: K, isTouched = true) => {
    touched[field] = isTouched

    if (validateOnBlur && isTouched) {
      validateFieldWithRules(field)
    }
  }

  const validateFieldWithRules = async <K extends keyof T>(field: K) => {
    const value = values[field]
    const error = await validateField(field as string, value)

    if (error) {
      setFieldError(field, error)
    } else {
      clearFieldError(field)
    }

    return error
  }

  const validateAllFields = async () => {
    const validationErrors = await validateForm(values)

    clearAllErrors()

    Object.entries(validationErrors).forEach(([field, error]) => {
      if (error) {
        setFieldError(field as keyof T, error)
      }
    })

    return Object.keys(validationErrors).length === 0
  }

  // Form methods
  const handleSubmit = async (event?: Event) => {
    event?.preventDefault()

    submitCount.value++

    // Touch all fields
    Object.keys(initialValues).forEach((key) => {
      touched[key as keyof T] = true
    })

    // Validate
    const isFormValid = await validateAllFields()

    if (!isFormValid) {
      onError?.(errors.value as Record<keyof T, string>)
      return
    }

    // Submit
    try {
      isSubmitting.value = true
      await onSubmit?.(values as T)
    } catch (error) {
      console.error('[useForm] Submit failed:', error)
    } finally {
      isSubmitting.value = false
    }
  }

  const reset = () => {
    Object.keys(initialValues).forEach((key) => {
      const k = key as keyof T
      values[k] = initialValues[k] as UnwrapRef<T>[keyof T]
      touched[k] = false
      dirty[k] = false
    })

    clearAllErrors()
    submitCount.value = 0
  }

  const resetField = <K extends keyof T>(field: K) => {
    values[field] = initialValues[field] as UnwrapRef<T>[K]
    touched[field] = false
    dirty[field] = false
    clearFieldError(field)
  }

  return {
    // State
    values,
    errors,
    touched,
    dirty,
    isSubmitting,
    submitCount,

    // Computed
    isValid,
    isDirty,
    isTouched,

    // Methods
    setFieldValue,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    validateField: validateFieldWithRules,
    validateForm: validateAllFields,
    handleSubmit,
    reset,
    resetField,
  }
}

/**
 * useFieldArray
 *
 * Управление массивом полей (для динамических форм)
 *
 * @example
 * ```ts
 * const { fields, append, remove, insert } = useFieldArray({
 *   name: 'tags',
 *   defaultValue: []
 * })
 *
 * append('nature')
 * remove(0)
 * insert(1, 'landscape')
 * ```
 */
export function useFieldArray<T = any>(options: { name: string; defaultValue?: T[] }) {
  const { name, defaultValue = [] } = options

  const fields = ref<T[]>([...defaultValue]) as Ref<T[]>

  const append = (value: T) => {
    fields.value.push(value)
  }

  const prepend = (value: T) => {
    fields.value.unshift(value)
  }

  const insert = (index: number, value: T) => {
    fields.value.splice(index, 0, value)
  }

  const remove = (index: number) => {
    fields.value.splice(index, 1)
  }

  const swap = (indexA: number, indexB: number) => {
    const temp = fields.value[indexA]
    fields.value[indexA] = fields.value[indexB] as T
    fields.value[indexB] = temp as T
  }

  const move = (from: number, to: number) => {
    const item = fields.value.splice(from, 1)[0]
    fields.value.splice(to, 0, item as T)
  }

  const replace = (index: number, value: T) => {
    fields.value[index] = value
  }

  const clear = () => {
    fields.value = []
  }

  const reset = () => {
    fields.value = [...defaultValue]
  }

  return {
    fields,
    append,
    prepend,
    insert,
    remove,
    swap,
    move,
    replace,
    clear,
    reset,
  }
}

/**
 * useFormPersist
 *
 * Сохранение формы в localStorage
 *
 * @example
 * ```ts
 * const form = useForm({ ... })
 *
 * useFormPersist(form, 'create-pin-form')
 * ```
 */
export function useFormPersist<T extends Record<string, any>>(
  form: ReturnType<typeof useForm<T>>,
  storageKey: string,
  options: {
    debounce?: number
    exclude?: (keyof T)[]
  } = {},
) {
  const { debounce: debounceMs = 500, exclude = [] } = options

  // Load from localStorage
  const load = () => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data = JSON.parse(stored) as T
        Object.keys(data).forEach((key) => {
          const k = key as keyof T
          if (!exclude.includes(k)) {
            form.setFieldValue(k, data[k])
          }
        })
      }
    } catch (error) {
      console.error('[useFormPersist] Load failed:', error)
    }
  }

  // Save to localStorage
  const save = () => {
    try {
      const data = { ...form.values }
      exclude.forEach((key) => {
        delete data[key]
      })
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('[useFormPersist] Save failed:', error)
    }
  }

  // Clear localStorage
  const clear = () => {
    localStorage.removeItem(storageKey)
  }

  // Watch values changes
  let saveTimeout: ReturnType<typeof setTimeout> | undefined

  watch(
    () => form.values,
    () => {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(save, debounceMs)
    },
    { deep: true },
  )

  // Load on mount
  onMounted(() => {
    load()
  })

  // Clear on unmount (optional)
  // onUnmounted(() => {
  //   clear()
  // })

  return {
    load,
    save,
    clear,
  }
}
