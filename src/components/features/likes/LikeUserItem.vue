<!-- src/components/features/likes/LikeUserItem.vue -->
<script setup lang="ts">
/**
 * LikeUserItem - Элемент списка лайкнувших
 * ✅ Компонент был чистым
 */

import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import UserAvatar from '@/components/common/UserAvatar.vue'

export interface LikeUserItemProps {
  user: {
    id: string
    username: string
    imageId?: string | null
  }
  avatarUrl?: string
  size?: 'sm' | 'md' | 'lg'
  showLink?: boolean
}

const props = withDefaults(defineProps<LikeUserItemProps>(), {
  size: 'md',
  showLink: true,
})

const avatarSize = computed(() => {
  return {
    sm: 'sm' as const,
    md: 'lg' as const,
    lg: 'xl' as const,
  }[props.size]
})

const textClasses = computed(() => {
  return {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
  }[props.size]
})

const spacing = computed(() => {
  return {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-5',
  }[props.size]
})

const paddingClasses = computed(() => {
  return {
    sm: 'py-1 px-2',
    md: 'py-2 px-3',
    lg: 'py-3 px-6',
  }[props.size]
})
</script>

<template>
  <component
    :is="showLink ? RouterLink : 'div'"
    :to="showLink ? `/user/${user.username}` : undefined"
    :class="[
      'flex items-center hover:underline cursor-pointer transition-opacity hover:opacity-80',
      spacing,
      paddingClasses,
    ]"
  >
    <UserAvatar
      :user="{
        id: user.id,
        username: user.username,
        imageId: user.imageId || undefined,
      }"
      :image-url="avatarUrl"
      :size="avatarSize"
      :clickable="false"
    />
    <span :class="['truncate font-medium', textClasses]">
      {{ user.username }}
    </span>
  </component>
</template>
