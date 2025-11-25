// src/composables/api/usePinActions.ts
/**
 * usePinActions - Быстрые действия для пина (like/save)
 *
 * Используется в PinCard для оптимистичных обновлений
 */

import { usePinsStore } from '@/stores/pins.store'

export function usePinActions(pinId: string | (() => string)) {
  const pinsStore = usePinsStore()

  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  return {
    like: () => pinsStore.likePin(getId()),
    unlike: () => pinsStore.unlikePin(getId()),
    save: () => pinsStore.savePin(getId()),
    unsave: () => pinsStore.unsavePin(getId()),
    delete: () => pinsStore.deletePin(getId()),
  }
}
