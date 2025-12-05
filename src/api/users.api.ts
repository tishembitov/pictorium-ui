// src/api/users.api.ts
/**
 * Users API
 */

import { userServiceClient } from './client'
import type {
  GetCurrentUserResponse,
  GetUserByUsernameResponse,
  GetUserByIdResponse,
  UserUpdateRequest,
  UpdateUserResponse,
  User,
} from '@/types'

const BASE_PATH = '/api/v1/users'

export const usersApi = {
  /**
   * Получить текущего пользователя
   */
  getCurrentUser: async (): Promise<GetCurrentUserResponse> => {
    const { data } = await userServiceClient.get(`${BASE_PATH}/me`)
    return data
  },

  /**
   * Получить пользователя по username
   */
  getUserByUsername: async (username: string): Promise<GetUserByUsernameResponse> => {
    const { data } = await userServiceClient.get(`${BASE_PATH}/user/username/${username}`)
    return data
  },

  /**
   * Получить пользователя по ID
   */
  getUserById: async (userId: string): Promise<GetUserByIdResponse> => {
    const { data } = await userServiceClient.get(`${BASE_PATH}/user/id/${userId}`)
    return data
  },

  /**
   * Обновить профиль текущего пользователя
   */
  updateUser: async (userData: UserUpdateRequest): Promise<UpdateUserResponse> => {
    const { data } = await userServiceClient.patch(`${BASE_PATH}/me`, userData)
    return data
  },
}
