// src/composables/api/usePinActions.ts
import { computed } from 'vue'
import { usePinsStore } from '@/stores/pins.store'

export function usePinActions(pinId: string | (() => string)) {
  const pinsStore = usePinsStore()

  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  // ✅ Добавить computed для текущего состояния
  const pin = computed(() => pinsStore.getPinById(getId()))
  const isLiked = computed(() => pin.value?.isLiked ?? false)
  const isSaved = computed(() => pin.value?.isSaved ?? false)

  return {
    pin,
    isLiked,
    isSaved,

    like: () => pinsStore.likePin(getId()),
    unlike: () => pinsStore.unlikePin(getId()),
    save: () => pinsStore.savePin(getId()),
    unsave: () => pinsStore.unsavePin(getId()),
    delete: () => pinsStore.deletePin(getId()),

    // ✅ Toggle helpers
    toggleLike: async () => {
      if (isLiked.value) {
        await pinsStore.unlikePin(getId())
      } else {
        await pinsStore.likePin(getId())
      }
    },
    toggleSave: async () => {
      if (isSaved.value) {
        await pinsStore.unsavePin(getId())
      } else {
        await pinsStore.savePin(getId())
      }
    },
  }
}
