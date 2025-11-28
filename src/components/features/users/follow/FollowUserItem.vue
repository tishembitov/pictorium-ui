<!-- src/components/features/users/follow/FollowUserItem.vue -->
<script setup lang="ts">
/**
 * FollowUserItem - Элемент пользователя в списке
 * ✅ Типизация исправлена
 */

import { RouterLink } from 'vue-router'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import type { User } from '@/types'

export interface FollowUserItemProps {
  user: Pick<User, 'id' | 'username' | 'imageUrl'>
  avatarBlobUrl?: string | null
}

const props = defineProps<FollowUserItemProps>()

const emit = defineEmits<{
  click: [userId: string]
}>()

function handleClick() {
  emit('click', props.user.id)
}
</script>

<template>
  <RouterLink
    :to="`/user/${user.username}`"
    class="my-2 ml-6 flex items-center gap-5 hover:underline cursor-pointer transition-colors hover:bg-white/10 rounded-lg p-2"
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
    </div>
  </RouterLink>
</template>
