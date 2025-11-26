<!-- src/components/features/user/profile/UserBoards.vue -->
<script setup lang="ts">
/**
 * UserBoards - Доски пользователя
 * Использует: BoardList component
 */

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import BoardList from '@/components/features/boards/BoardList.vue'

export interface UserBoardsProps {
  userId: string
  authUserId?: string
}

const props = defineProps<UserBoardsProps>()

const emit = defineEmits<{
  (e: 'selectBoard', boardId: string): void
  (e: 'createBoard'): void
}>()

const authStore = useAuthStore()

const isCurrentUser = computed(() => {
  return props.userId === authStore.userId
})
</script>

<template>
  <BoardList
    :user-id="userId"
    :variant="isCurrentUser ? 'my' : 'user'"
    :can-edit="isCurrentUser"
    :show-create-button="isCurrentUser"
    @select="(board) => emit('selectBoard', board.id)"
    @create="emit('createBoard')"
  />
</template>
