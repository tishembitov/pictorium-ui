<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import BoardGrid from '@/components/features/board/BoardGrid.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { boardsApi } from '@/api/boards.api'
import { useAuthStore } from '@/stores/auth.store'
import type { Board } from '@/types'

export interface UserBoardsProps {
  userId: string
  autoLoad?: boolean
}

const props = withDefaults(defineProps<UserBoardsProps>(), {
  autoLoad: true,
})

const authStore = useAuthStore()
const boards = ref<Board[]>([])
const isLoading = ref(false)

const isMe = computed(() => authStore.userId === props.userId)

const loadBoards = async () => {
  try {
    isLoading.value = true

    if (isMe.value) {
      boards.value = await boardsApi.getMyBoards()
    } else {
      boards.value = await boardsApi.getUserBoards(props.userId)
    }
  } catch (error) {
    console.error('[UserBoards] Load boards failed:', error)
  } finally {
    isLoading.value = false
  }
}

const refresh = () => {
  loadBoards()
}

onMounted(() => {
  if (props.autoLoad) {
    loadBoards()
  }
})

defineExpose({
  refresh,
})
</script>

<template>
  <div class="py-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <BaseLoader variant="spinner" size="lg" />
    </div>

    <!-- Boards Grid -->
    <BoardGrid v-else-if="boards.length > 0" :boards="boards" />

    <!-- Empty State -->
    <EmptyState
      v-else-if="!isLoading && boards.length === 0"
      title="No boards yet"
      message="Create a board to organize your pins"
      icon="pi-folder"
      variant="default"
    />
  </div>
</template>
