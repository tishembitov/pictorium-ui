<!-- src/components/features/user/follow/FollowUserItem.vue -->
<script setup lang="ts">
/**
 * FollowUserItem - Элемент пользователя в списке подписчиков/подписок
 * Визуальный стиль из старого FollowersSection.vue
 */

import { RouterLink } from 'vue-router'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'

export interface FollowUserItemProps {
  user: {
    id: string
    username: string
    imageUrl?: string | null
    verified?: boolean
  }
  avatarBlobUrl?: string | null
}

const props = defineProps<FollowUserItemProps>()

const emit = defineEmits<{
  (e: 'click', userId: string): void
}>()

function handleClick() {
  emit('click', props.user.id)
}
</script>

<template>
  <!-- Стиль из старого FollowersSection.vue -->
  <RouterLink
    :to="`/user/${user.username}`"
    class="my-2 ml-6 flex items-center space-x-5 hover:underline cursor-pointer"
    @click="handleClick"
  >
    <BaseAvatar
      :src="avatarBlobUrl || user.imageUrl || undefined"
      :alt="user.username"
      size="xl"
      class="!w-20 !h-20"
    />
    <div class="flex items-center gap-2">
      <span class="truncate text-xl">{{ user.username }}</span>
      <i v-if="user.verified" class="pi pi-verified text-blue-500" />
    </div>
  </RouterLink>
</template>
