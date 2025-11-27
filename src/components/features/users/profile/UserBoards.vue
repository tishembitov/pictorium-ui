<!-- src/components/features/users/profile/UserBoards.vue -->
<script setup lang="ts">
/**
 * UserBoards - Доски пользователя
 * ✅ Чистый wrapper компонент
 */

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import BoardList from '@/components/features/boards/BoardList.vue'

export interface UserBoardsProps {
  userId: string
}

const props = defineProps<UserBoardsProps>()

const emit = defineEmits<{
  selectBoard: [boardId: string]
  createBoard: []
}>()

const authStore = useAuthStore()

const isCurrentUser = computed(() => props.userId === authStore.userId)
</script>

<template>
  <div class="mt-6 px-4">
    <BoardList
      :user-id="userId"
      :variant="isCurrentUser ? 'my' : 'user'"
      :can-edit="isCurrentUser"
      :show-create-button="isCurrentUser"
      @select="(board) => emit('selectBoard', board.id)"
      @create="emit('createBoard')"
    />
  </div>
</template>
