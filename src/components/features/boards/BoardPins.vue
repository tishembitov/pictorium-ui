<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import PinMasonry from '@/components/features/pins/PinMasonry.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import { useBoards } from '@/composables/api/useBoards'
import type { Pin } from '@/types'

export interface BoardPinsProps {
  boardId: string
  canEdit?: boolean
  boardName?: string
}

const props = withDefaults(defineProps<BoardPinsProps>(), {
  canEdit: false,
})

const emit = defineEmits<(e: 'pinDeleted', pinId: string) => void>()

// ✅ FIX: используем useBoards вместо несуществующего useBoardDetail
const { currentBoardPins, isLoadingPins, hasBoardPinsMore, fetchBoardById, loadMoreBoardPins } =
  useBoards()

const loadingMore = ref(false)

// Computed для удобства
const pins = computed(() => currentBoardPins.value)
const isLoading = computed(() => isLoadingPins.value)

onMounted(async () => {
  await fetchBoardById(props.boardId, 0, 15)
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

watch(
  () => props.boardId,
  async (newId) => {
    if (newId) {
      await fetchBoardById(newId, 0, 15)
    }
  },
)

const handleScroll = () => {
  const scrollableHeight = document.documentElement.scrollHeight
  const currentScrollPosition = window.innerHeight + window.scrollY

  if (currentScrollPosition + 200 >= scrollableHeight && !loadingMore.value) {
    loadMore()
  }
}

const loadMore = async () => {
  if (!hasBoardPinsMore.value || isLoading.value) return

  try {
    loadingMore.value = true
    await loadMoreBoardPins()
  } finally {
    loadingMore.value = false
  }
}

const handleDelete = (pinId: string) => {
  emit('pinDeleted', pinId)
}
</script>

<template>
  <div class="mt-10 min-h-[500px]">
    <h2 v-if="boardName" class="text-2xl font-bold text-center mb-6">{{ boardName }}</h2>

    <div v-if="isLoading && pins.length === 0" class="flex justify-center py-8">
      <BaseLoader variant="spinner" size="lg" />
    </div>

    <EmptyState
      v-else-if="!isLoading && pins.length === 0"
      title="No pins on board"
      message="Start adding pins to this board"
      image="https://i.pinimg.com/736x/40/f1/b0/40f1b01bf3df9bc24bdbad4589125023.jpg"
    />

    <PinMasonry
      v-else
      :pins="pins"
      :variant="canEdit ? 'board' : 'default'"
      :can-delete="canEdit"
      :loading="loadingMore"
      :has-more="hasBoardPinsMore"
      @load-more="loadMore"
      @delete="handleDelete"
    />
  </div>
</template>
