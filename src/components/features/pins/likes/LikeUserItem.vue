<script setup lang="ts">
import { RouterLink } from 'vue-router'
import UserAvatar from '@/components/common/UserAvatar.vue'
import type { User } from '@/types'

export interface LikeUserItemProps {
  user: {
    id: string
    username: string
    imageUrl?: string
  }
  size?: 'sm' | 'md' | 'lg'
  showAvatar?: boolean
}

const props = withDefaults(defineProps<LikeUserItemProps>(), {
  size: 'md',
  showAvatar: true,
})

const avatarSizes = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
}

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
}

const gaps = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-5',
}
</script>

<template>
  <RouterLink
    :to="`/user/${user.username}`"
    :class="[
      'flex items-center hover:underline transition-opacity duration-200 hover:opacity-80',
      gaps[size],
    ]"
  >
    <UserAvatar
      v-if="showAvatar"
      :user="user"
      :imageUrl="user.imageUrl"
      :size="avatarSizes[size]"
      :clickable="false"
    />

    <span :class="['truncate font-medium', textSizes[size]]">{{ user.username }}</span>
  </RouterLink>
</template>
