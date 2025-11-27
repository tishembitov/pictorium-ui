// src/composables/api/usePinSave.ts
/**
 * usePinSave - Сохранение пина с состоянием
 * Устраняет дублирование в PinActions, PinDetailInfo, PinFullscreen
 */

import { ref, computed } from 'vue'
import { usePinActions } from './usePinActions'
import { useSuccessToast, useErrorToast } from '@/composables/ui/useToast'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function usePinSave(pinId: string | (() => string)) {
  const { save: savePin } = usePinActions(pinId)
  const { pinSaved } = useSuccessToast()
  const { showError } = useErrorToast()

  const saveState = ref<SaveState>('idle')

  const saveButtonText = computed(() => {
    switch (saveState.value) {
      case 'saving':
        return 'Saving...'
      case 'saved':
        return 'Saved'
      case 'error':
        return 'Already saved!'
      default:
        return 'Save'
    }
  })

  const isSaving = computed(() => saveState.value === 'saving')
  const canSave = computed(() => saveState.value === 'idle')

  async function save(): Promise<boolean> {
    if (saveState.value === 'saving') return false

    saveState.value = 'saving'

    try {
      await savePin()
      saveState.value = 'saved'
      pinSaved()
      return true
    } catch (error: any) {
      if (error?.response?.status === 409) {
        saveState.value = 'error'
      } else {
        saveState.value = 'idle'
        showError(error)
      }
      return false
    }
  }

  function reset() {
    saveState.value = 'idle'
  }

  return {
    saveState,
    saveButtonText,
    isSaving,
    canSave,
    save,
    reset,
  }
}
