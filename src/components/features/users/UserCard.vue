<!-- src/components/features/users/UserCard.vue -->
<script setup lang="ts">
/**
 * UserCard - Карточка пользователя
 * ✅ Типизация и структура корректны
 */

import { RouterLink } from 'vue-router'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import FollowButton from './follow/FollowButton.vue'
import type { User } from '@/types'

export interface UserCardProps {
  user: Pick<User, 'id' | 'username' | 'imageId' | 'description'>
  avatarUrl?: string | null
  followersCount?: number
  showFollowButton?: boolean
  variant?: 'default' | 'compact'
}

const props = withDefaults(defineProps<UserCardProps>(), {
  followersCount: 0,
  showFollowButton: true,
  variant: 'default',
})
</script>

<template>
  <div
    :class="[
      'bg-white rounded-2xl shadow-md hover:shadow-lg transition',
      variant === 'compact' ? 'p-3' : 'p-4',
    ]"
  >
    <RouterLink :to="`/user/${user.username}`" class="flex items-center gap-3">
      <BaseAvatar
        :src="avatarUrl || undefined"
        :alt="user.username"
        :size="variant === 'compact' ? 'md' : 'lg'"
      />

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-semibold truncate">{{ user.username }}</span>
        </div>

        <p v-if="user.description && variant === 'default'" class="text-sm text-gray-500 truncate">
          {{ user.description }}
        </p>

        <p v-if="followersCount > 0" class="text-sm text-gray-400">
          {{ followersCount }} followers
        </p>
      </div>
    </RouterLink>

    <FollowButton
      v-if="showFollowButton"
      :user-id="user.id"
      size="sm"
      variant="outline"
      class="mt-3 w-full"
    />
  </div>
</template>
