// src/composables/form/useForm.ts
/**
 * useForm - Form state management
 *
 * Уникальный composable для управления формами
 */

import { ref, reactive, computed, type UnwrapRef } from 'vue'
import { useFormValidation, type ValidationRules } from './useFormValidation'

export interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T
  validationRules?: ValidationRules<T>
  validateOnChange?: boolean
  validateOnBlur?: boolean
  onSubmit?: (values: T) => void | Promise<void>
}

export function useForm<T extends Record<string, unknown>>(options: UseFormOptions<T>) {
  const {
    initialValues,
    validationRules = {},
    validateOnChange = true,
    validateOnBlur = true,
    onSubmit,
  } = options

  // State
  const values = reactive({ ...initialValues }) as UnwrapRef<T>
  const errors = ref<Partial<Record<keyof T, string>>>({})
  const touched = reactive<Record<keyof T, boolean>>(
    Object.keys(initialValues).reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {} as Record<keyof T, boolean>,
    ),
  )
  const isSubmitting = ref(false)

  // Validation
  const { validateField, validateAll } = useFormValidation(validationRules)

  // Computed
  const isValid = computed(() => Object.keys(errors.value).length === 0)
  const isDirty = computed(() => {
    return Object.keys(initialValues).some(
      (key) => (values as any)[key] !== initialValues[key as keyof T],
    )
  })

  // Methods
  const setFieldValue = <K extends keyof T>(field: K, value: T[K]) => {
    ;(values as any)[field] = value

    if (validateOnChange) {
      validateFieldInternal(field)
    }
  }

  const setFieldTouched = <K extends keyof T>(field: K) => {
    ;(touched as any)[field] = true

    if (validateOnBlur) {
      validateFieldInternal(field)
    }
  }

  const setFieldError = <K extends keyof T>(field: K, error: string) => {
    errors.value[field] = error
  }

  const clearFieldError = <K extends keyof T>(field: K) => {
    delete errors.value[field]
  }

  const validateFieldInternal = async <K extends keyof T>(field: K) => {
    const error = await validateField(field as string, (values as any)[field])
    if (error) {
      errors.value[field] = error
    } else {
      delete errors.value[field]
    }
    return !error
  }

  const validateForm = async () => {
    const validationErrors = await validateAll(values as T)
    errors.value = validationErrors as Partial<Record<keyof T, string>>
    return Object.keys(validationErrors).length === 0
  }

  const handleSubmit = async (e?: Event) => {
    e?.preventDefault()

    // Touch all fields
    Object.keys(initialValues).forEach((key) => {
      ;(touched as any)[key] = true
    })

    const isFormValid = await validateForm()
    if (!isFormValid) return

    try {
      isSubmitting.value = true
      await onSubmit?.({ ...values } as T)
    } finally {
      isSubmitting.value = false
    }
  }

  const reset = () => {
    Object.keys(initialValues).forEach((key) => {
      const k = key as keyof T
      ;(values as any)[k] = initialValues[k]
      ;(touched as any)[k] = false
    })
    errors.value = {}
  }

  return {
    // State
    values,
    errors,
    touched,
    isSubmitting,

    // Computed
    isValid,
    isDirty,

    // Methods
    setFieldValue,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    validateField: validateFieldInternal,
    validateForm,
    handleSubmit,
    reset,
  }
}

/**
 * useFieldArray - Динамические массивы полей
 */
export function useFieldArray<T>(defaultValue: T[] = []) {
  const fields = ref<T[]>([...defaultValue])

  return {
    fields,
    append: (value: T) => fields.value.push(value as any),
    prepend: (value: T) => fields.value.unshift(value as any),
    insert: (index: number, value: T) => fields.value.splice(index, 0, value as any),
    remove: (index: number) => fields.value.splice(index, 1),
    swap: (a: number, b: number) => {
      const temp = fields.value[a]
      if (temp !== undefined && fields.value[b] !== undefined) {
        fields.value[a] = fields.value[b]!
        fields.value[b] = temp
      }
    },
    clear: () => {
      fields.value = []
    },
    reset: () => {
      fields.value = [...defaultValue]
    },
  }
}
