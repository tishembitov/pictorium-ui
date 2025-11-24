/**
 * useApiCall - Универсальная обертка для API вызовов
 *
 * Обрабатывает ошибки, loading состояния, показывает toast уведомления
 */

import { ref, type Ref } from 'vue'
import { useToast } from '@/composables/ui/useToast'
import { handleApiError } from '@/api/client'

export interface UseApiCallOptions {
  showSuccessToast?: boolean
  successMessage?: string
  showErrorToast?: boolean
  errorMessage?: string
  onSuccess?: (data: unknown) => void
  onError?: (error: unknown) => void
}

export interface UseApiCallReturn<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
  isLoading: Ref<boolean>
  execute: (...args: unknown[]) => Promise<T | null>
  reset: () => void
}

export function useApiCall<T>(
  apiFn: (...args: unknown[]) => Promise<T>,
  options: UseApiCallOptions = {},
): UseApiCallReturn<T> {
  const { showToast } = useToast()

  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  const {
    showSuccessToast = false,
    successMessage = 'Success!',
    showErrorToast = true,
    errorMessage,
    onSuccess,
    onError,
  } = options

  const execute = async (...args: unknown[]): Promise<T | null> => {
    try {
      isLoading.value = true
      error.value = null

      const result = await apiFn(...args)
      data.value = result as T

      if (showSuccessToast) {
        showToast(successMessage, 'success')
      }

      onSuccess?.(result)

      return result as T
    } catch (err) {
      error.value = err as Error

      if (showErrorToast) {
        const message = errorMessage || handleApiError(err)
        showToast(message, 'error')
      }

      onError?.(err)

      return null
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    data.value = null
    error.value = null
    isLoading.value = false
  }

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  }
}
