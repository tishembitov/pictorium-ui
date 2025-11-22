<script setup lang="ts">
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import type { Board } from '@/types'

export interface BoardDeleteDialogProps {
  modelValue: boolean
  board: Board | null
  loading?: boolean
}

const props = withDefaults(defineProps<BoardDeleteDialogProps>(), {
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<template>
  <ConfirmDialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="`Delete ${board?.title || 'Board'}?`"
    message="Are you sure you want to delete this board? All pins will be removed from this board. This action cannot be undone."
    confirm-text="Delete Board"
    cancel-text="Cancel"
    variant="danger"
    :loading="loading"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <template v-if="board && board.pinsCount" #default>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-yellow-600 text-xl"></i>
          <div class="flex-1 text-left">
            <p class="font-semibold text-yellow-800 mb-1">Warning</p>
            <p class="text-sm text-yellow-700">
              This board contains {{ board.pinsCount }} pin{{ board.pinsCount !== 1 ? 's' : '' }}.
              They will be removed from this board but not deleted.
            </p>
          </div>
        </div>
      </div>
    </template>
  </ConfirmDialog>
</template>
