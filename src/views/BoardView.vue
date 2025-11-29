<!-- src/views/BoardView.vue -->
<script setup lang="ts">
/**
 * BoardView - Страница доски с пинами
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBoards, useBoardPins } from '@/composables/api/useBoards'
import { useAuth } from '@/composables/auth/useAuth'
import { useDocumentTitle } from '@/composables/utils/useDocumentTitle'

import AppHeader from '@/components/common/AppHeader.vue'
import BackButton from '@/components/common/BackButton.vue'
import BoardPins from '@/components/features/boards/BoardPins.vue'
import BoardEditModal from '@/components/features/boards/BoardEditModal.vue'
import BoardDeleteDialog from '@/components/features/boards/BoardDeleteDialog.vue'
import BoardActions from '@/components/features/boards/BoardActions.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'

import type { BoardWithPins, PinWithBlob, Board } from '@/types'

const route = useRoute()
const router = useRouter()
const { userId } = useAuth()
const { fetchBoardById } = useBoards()

// ============ STATE ============

const boardId = computed(() => route.params.id as string)
const board = ref<BoardWithPins | null>(null)
const isLoadingBoard = ref(true)

// Modals
const showEditModal = ref(false)
const showDeleteDialog = ref(false)

// ============ COMPOSABLES ============

const { pins, isLoading, fetch, cleanup } = useBoardPins(() => boardId.value)

const pageTitle = computed(() => board.value?.title || 'Board')
useDocumentTitle(pageTitle)

// ============ COMPUTED ============

const canEdit = computed((): boolean => {
  return board.value !== null && userId.value === board.value.userId
})
// ============ METHODS ============

async function loadBoard() {
  isLoadingBoard.value = true
  try {
    board.value = await fetchBoardById(boardId.value)
  } catch (error) {
    router.push('/not-found')
  } finally {
    isLoadingBoard.value = false
  }
}

function handlePinClick(pin: PinWithBlob) {
  router.push(`/pin/${pin.id}`)
}

function handleEdit() {
  showEditModal.value = true
}

function handleBoardUpdated(updated: Board) {
  if (board.value) {
    board.value = { ...board.value, ...updated }
  }
  showEditModal.value = false
}

function handleDelete() {
  showDeleteDialog.value = true
}

function handleBoardDeleted() {
  router.push('/')
}

// ============ LIFECYCLE ============

onMounted(async () => {
  await Promise.all([loadBoard(), fetch(0, 20)])
})

watch(boardId, async () => {
  cleanup()
  await Promise.all([loadBoard(), fetch(0, 20)])
})
</script>

<template>
  <div class="min-h-screen">
    <AppHeader />

    <!-- Modals -->
    <BoardEditModal v-model="showEditModal" :board="board" @updated="handleBoardUpdated" />

    <BoardDeleteDialog v-model="showDeleteDialog" :board="board" @deleted="handleBoardDeleted" />

    <div class="ml-20 mt-20">
      <BackButton position="absolute" class="ml-20 mt-20" />

      <!-- Loading -->
      <div v-if="isLoadingBoard" class="flex justify-center py-20">
        <BaseLoader variant="colorful" size="lg" />
      </div>

      <template v-else-if="board">
        <!-- Board Header -->
        <div class="text-center py-8">
          <h1 class="text-4xl font-bold">{{ board.title }}</h1>
          <p class="text-gray-500 mt-2">{{ board.pinsCount || pins.length }} pins</p>

          <!-- Actions -->
          <div v-if="canEdit" class="mt-4">
            <BoardActions
              :board="board"
              :can-edit="true"
              :can-delete="true"
              variant="inline"
              @edit="handleEdit"
              @delete="handleDelete"
            />
          </div>
        </div>

        <!-- Pins -->
        <BoardPins
          :board-id="boardId"
          :board-name="board.title"
          :can-edit="canEdit"
          @pin-click="handlePinClick"
        />

        <!-- Empty State -->
        <EmptyState
          v-if="!isLoading && pins.length === 0"
          title="No pins in this board"
          message="Save pins to this board to see them here"
        />
      </template>
    </div>
  </div>
</template>
