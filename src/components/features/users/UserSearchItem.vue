<!-- src/components/features/users/UserSearchItem.vue -->
<script setup lang="ts">
/**
 * UserSearchItem - User в результатах поиска
 * ✅ Типизация корректна
 */

import { RouterLink } from 'vue-router'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import type { User } from '@/types'

export interface UserSearchItemProps {
  user: Pick<User, 'id' | 'username' | 'imageId'>
  avatarUrl?: string | null
  highlight?: string
}

const props = defineProps<UserSearchItemProps>()

const emit = defineEmits<{
  click: []
}>()

// Highlight matching text
function highlightMatch(text: string, query: string): string {
  if (!query) return text
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
</script>

<template>
  <RouterLink
    :to="`/user/${user.username}`"
    class="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition"
    @click="emit('click')"
  >
    <BaseAvatar :src="avatarUrl || undefined" :alt="user.username" size="sm" />

    <div class="flex items-center gap-2">
      <span class="font-medium" v-html="highlightMatch(user.username, highlight || '')" />
    </div>
  </RouterLink>
</template>
