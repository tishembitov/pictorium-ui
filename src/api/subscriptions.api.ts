/**
 * Subscriptions API
 */

import { userServiceClient } from './client'
import type {
  FollowUserResponse,
  GetFollowersParams,
  GetFollowersResponse,
  GetFollowingParams,
  GetFollowingResponse,
  CheckFollowResponse,
  Pageable,
} from '@/types'

const BASE_PATH = '/api/v1/subscriptions'

export const subscriptionsApi = {
  /**
   * Подписаться на пользователя
   */
  followUser: async (userIdToFollow: string): Promise<FollowUserResponse> => {
    const { data } = await userServiceClient.post(`${BASE_PATH}/users/${userIdToFollow}`)
    return data
  },

  /**
   * Отписаться от пользователя
   */
  unfollowUser: async (userIdToUnfollow: string): Promise<void> => {
    await userServiceClient.delete(`${BASE_PATH}/users/${userIdToUnfollow}`)
  },

  /**
   * Получить подписчиков пользователя
   */
  getFollowers: async (userId: string, pageable: Pageable): Promise<GetFollowersResponse> => {
    const { data } = await userServiceClient.get(`${BASE_PATH}/followers/${userId}`, {
      params: pageable,
    })
    return data
  },

  /**
   * Получить подписки пользователя
   */
  getFollowing: async (userId: string, pageable: Pageable): Promise<GetFollowingResponse> => {
    const { data } = await userServiceClient.get(`${BASE_PATH}/following/${userId}`, {
      params: pageable,
    })
    return data
  },

  /**
   * Проверить подписку на пользователя
   */
  checkFollow: async (userIdToCheck: string): Promise<CheckFollowResponse> => {
    const { data } = await userServiceClient.get(`${BASE_PATH}/check/${userIdToCheck}`)
    return data
  },
}
