// src/composables/api/usePinLikes.ts
/**
 * usePinLikes - Загрузка списка пользователей, лайкнувших пин
 */

import { likesApi } from '@/api'
import { useLikesBase, type LikeUser, type UseLikesBaseOptions } from './useLikesBase'

export interface PinLikeUser extends LikeUser {
  likedAt: string
}

export interface UsePinLikesOptions extends UseLikesBaseOptions {}

export function usePinLikes(pinId: string | (() => string), options: UsePinLikesOptions = {}) {
  const getId = () => (typeof pinId === 'string' ? pinId : pinId())

  return useLikesBase<PinLikeUser>(
    getId,
    {
      fetchLikes: async (id, pageable) => {
        const response = await likesApi.getPinLikes(id, { pinId: id, pageable })
        return {
          content: response.content,
          number: response.number,
          totalElements: response.totalElements,
          last: response.last,
      }
      },
    },
    options,
  )
}
