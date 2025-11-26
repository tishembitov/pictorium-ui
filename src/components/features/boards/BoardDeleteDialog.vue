<!-- src/components/features/boards/BoardDeleteDialog.vue -->
<script setup lang="ts">
/**
 * BoardDeleteDialog - Подтверждение удаления доски
 */

import { ref, computed } from 'vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useBoards } from '@/composables/api/useBoards'
import { useToast } from '@/composables/ui/useToast'
import type { BoardWithPins } from '@/types'

export interface BoardDeleteDialogProps {
  modelValue: boolean
  board: BoardWithPins | null
}

const props = defineProps<BoardDeleteDialogProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'deleted', boardId: string): void
}>()

const { deleteBoard } = useBoards()
const { success, error: showError } = useToast()

const isDeleting = ref(false)

const boardTitle = computed(() => props.board?.title || 'this board')

const message = computed(() => {
  const pinsCount = props.board?.pinsCount || props.board?.pins?.length || 0

  if (pinsCount > 0) {
    return `This board contains ${pinsCount} pin${pinsCount !== 1 ? 's' : ''}. They will be removed from this board but not deleted.`
  }

  return 'Are you sure you want to delete this board? This action cannot be undone.'
})

const handleConfirm = async () => {
  if (!props.board) return

  try {
    isDeleting.value = true
    await deleteBoard(props.board.id)
    success('Board deleted!')
    emit('deleted', props.board.id)
    emit('update:modelValue', false)
  } catch (e) {
    showError('Failed to delete board')
    console.error('[BoardDeleteDialog] Delete failed:', e)
  } finally {
    isDeleting.value = false
  }
}

const handleCancel = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <ConfirmDialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="`Delete '${boardTitle}'?`"
    :message="message"
    confirm-text="Delete"
    cancel-text="Cancel"
    variant="danger"
    :loading="isDeleting"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>
