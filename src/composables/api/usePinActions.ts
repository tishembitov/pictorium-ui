// src/composables/api/usePinActions.ts
import { computed, ref } from 'vue'
import { usePinsStore } from '@/stores/pins.store'
import { useSuccessToast, useErrorToast } from '@/composables/ui/useToast'

export interface PinUpdateData {
  title?: string
  description?: string
  href?: string
  tags?: string[]
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function usePinActions(pinId: string | (() => string)) {
  const pinsStore = usePinsStore()
  const { pinSaved, pinUpdated, pinDeleted } = useSuccessToast()
  const { showError } = useErrorToast()

  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  // Loading states
  const isLoading = ref(false)
  const isUpdating = ref(false)
  const isDeleting = ref(false)
  const isTogglingLike = ref(false)

  // ✅ Расширенное состояние для save
  const saveState = ref<SaveState>('idle')

  // Computed
  const pin = computed(() => pinsStore.getPinById(getId()))
  const isLiked = computed(() => pin.value?.isLiked ?? false)
  const isSaved = computed(() => pin.value?.isSaved ?? false)

  // ✅ UI computed для save
  const isTogglingSave = computed(() => saveState.value === 'saving')
  const saveButtonText = computed(() => {
    // Если уже сохранён в store - показываем Saved
    if (isSaved.value && saveState.value === 'idle') return 'Saved'

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

  // Helper
  async function withLoading<T>(loadingRef: { value: boolean }, fn: () => Promise<T>): Promise<T> {
    loadingRef.value = true
    isLoading.value = true
    try {
      return await fn()
    } finally {
      loadingRef.value = false
      isLoading.value = false
    }
  }

  // Actions
  async function update(data: PinUpdateData) {
    const result = await withLoading(isUpdating, () => pinsStore.updatePin(getId(), data))
    pinUpdated()
    return result
  }

  async function deletePin() {
    const result = await withLoading(isDeleting, () => pinsStore.deletePin(getId()))
    pinDeleted()
    return result
  }

  async function like() {
    return withLoading(isTogglingLike, () => pinsStore.likePin(getId()))
  }

  async function unlike() {
    return withLoading(isTogglingLike, () => pinsStore.unlikePin(getId()))
  }

  async function toggleLike() {
    return withLoading(isTogglingLike, async () => {
      if (isLiked.value) {
        await pinsStore.unlikePin(getId())
      } else {
        await pinsStore.likePin(getId())
      }
    })
  }

  // ✅ Save с расширенной логикой
  async function save(): Promise<boolean> {
    if (saveState.value === 'saving') return false

    saveState.value = 'saving'
    isLoading.value = true

    try {
      await pinsStore.savePin(getId())
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
    } finally {
      isLoading.value = false
    }
  }

  async function unsave() {
    saveState.value = 'saving'
    isLoading.value = true

    try {
      await pinsStore.unsavePin(getId())
      saveState.value = 'idle'
    } catch (error) {
      showError(error)
    } finally {
      isLoading.value = false
    }
  }

  async function toggleSave(): Promise<boolean> {
    if (isSaved.value) {
      await unsave()
      return false
    } else {
      return await save()
    }
  }

  function resetSaveState() {
    saveState.value = 'idle'
  }

  return {
    // State
    pin,
    isLiked,
    isSaved,

    // Loading states
    isLoading,
    isUpdating,
    isDeleting,
    isTogglingLike,
    isTogglingSave,

    // ✅ Save UI state
    saveState,
    saveButtonText,

    // Actions
    like,
    unlike,
    save,
    unsave,
    delete: deletePin,
    update,
    toggleLike,
    toggleSave,
    resetSaveState,

    // Partial updates
    updateTitle: (title: string) => update({ title }),
    updateDescription: (description: string) => update({ description }),
    updateHref: (href: string) => update({ href }),
    updateTags: (tags: string[]) => update({ tags }),
  }
}
