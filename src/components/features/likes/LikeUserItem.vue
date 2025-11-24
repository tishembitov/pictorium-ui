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
  sm: 'sm', // 40px
  md: 'md', // 48px
  lg: 'lg', // 64px
  xl: 'xl', // 80px ✅
}

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-2xl', // ✅ 1.5rem
}

const gaps = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-5',
  xl: 'gap-5', // ✅ 1.25rem
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
