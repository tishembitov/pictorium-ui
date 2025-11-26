<!-- src/components/features/user/UserCard.vue -->
<script setup lang="ts">
/**
 * UserCard - Карточка пользователя
 */

import { RouterLink } from 'vue-router'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import FollowButton from './follow/FollowButton.vue'

export interface UserCardProps {
  user: {
    id: string
    username: string
    imageUrl?: string | null
    description?: string | null
    verified?: boolean
  }
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
      'bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition',
      variant === 'compact' && 'p-3',
    ]"
  >
    <RouterLink :to="`/user/${user.username}`" class="flex items-center gap-3">
      <BaseAvatar
        :src="avatarUrl || user.imageUrl || undefined"
        :alt="user.username"
        :size="variant === 'compact' ? 'md' : 'lg'"
      />

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-semibold truncate">{{ user.username }}</span>
          <i v-if="user.verified" class="pi pi-verified text-blue-500 text-sm" />
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
