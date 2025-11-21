<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { storageApi } from '@/api/storage.api'
import type { User } from '@/types'

export interface FollowUserItemProps {
  user: User
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<FollowUserItemProps>(), {
  size: 'lg',
})

const userImage = ref<string | null>(null)

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
}

onMounted(async () => {
  if (props.user.imageUrl) {
    try {
      const blob = await storageApi.downloadImage(props.user.imageUrl)
      userImage.value = URL.createObjectURL(blob)
    } catch (error) {
      console.error('[FollowUserItem] Load avatar failed:', error)
    }
  }
})
</script>

<template>
  <RouterLink
    :to="`/user/${user.username}`"
    :class="[
      'flex items-center gap-4 p-2 rounded-lg hover:bg-gray-100 transition',
      sizeClasses[size],
    ]"
  >
    <UserAvatar :user="user" :image-url="userImage" :size="size" />

    <div class="flex-1 truncate">
      <p class="font-medium truncate">{{ user.username }}</p>
      <p v-if="user.description" class="text-sm text-gray-500 truncate">
        {{ user.description }}
      </p>
    </div>
  </RouterLink>
</template>
