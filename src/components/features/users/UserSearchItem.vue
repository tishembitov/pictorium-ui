<!-- src/components/features/user/UserSearchItem.vue -->
<script setup lang="ts">
/**
 * UserSearchItem - User в результатах поиска
 */

import { RouterLink } from 'vue-router'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'

export interface UserSearchItemProps {
  user: {
    id: string
    username: string
    imageUrl?: string | null
    verified?: boolean
  }
  avatarUrl?: string | null
  highlight?: string
}

const props = defineProps<UserSearchItemProps>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

// Highlight matching text
function highlightMatch(text: string, query: string): string {
  if (!query) return text
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
}
</script>

<template>
  <RouterLink
    :to="`/user/${user.username}`"
    class="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition"
    @click="emit('click')"
  >
    <BaseAvatar :src="avatarUrl || user.imageUrl || undefined" :alt="user.username" size="sm" />

    <div class="flex items-center gap-2">
      <span class="font-medium" v-html="highlightMatch(user.username, highlight || '')" />
      <i v-if="user.verified" class="pi pi-verified text-blue-500 text-sm" />
    </div>
  </RouterLink>
</template>
