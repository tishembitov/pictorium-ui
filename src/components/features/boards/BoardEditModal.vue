<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useBoards } from '@/composables/api/useBoards'
import { useToast } from '@/composables/ui/useToast'
import { useForm } from '@/composables/form/useForm'
import { boardTitleValidator } from '@/composables/form/useFormValidation'
import type { Board } from '@/types'

export interface BoardEditModalProps {
  modelValue: boolean
  board: Board | null
}

const props = defineProps<BoardEditModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', board: Board): void
}>()

const { updateBoard } = useBoards()
const { showToast } = useToast()

const isSubmitting = ref(false)

const { values, errors, setFieldValue, validateForm, reset } = useForm({
  initialValues: {
    title: '',
  },
  validationRules: {
    title: boardTitleValidator,
  },
})

// Watch board changes to update form
watch(
  () => props.board,
  (newBoard) => {
    if (newBoard) {
      setFieldValue('title', newBoard.title)
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  if (!props.board) return

  try {
    isSubmitting.value = true

    const isValid = await validateForm()
    if (!isValid) return

    // API вызов (нужно добавить в boards.api.ts и useBoards)
    // const updatedBoard = await updateBoard(props.board.id, { title: values.title })

    // Временно эмулируем
    const updatedBoard = { ...props.board, title: values.title }

    showToast('Board updated successfully!', 'success')
    emit('updated', updatedBoard)
    emit('update:modelValue', false)
  } catch (error) {
    console.error('[BoardEditModal] Update failed:', error)
    showToast('Failed to update board', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  reset()
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Edit Board"
    size="sm"
  >
    <div class="space-y-4">
      <BaseInput
        :model-value="values.title"
        @update:model-value="setFieldValue('title', $event)"
        label="Board Name"
        placeholder="Enter board name"
        :error="errors.title"
        :max-length="200"
        :disabled="isSubmitting"
        required
      />
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="handleCancel" :disabled="isSubmitting">
        Cancel
      </BaseButton>

      <BaseButton variant="primary" @click="handleSubmit" :loading="isSubmitting">
        Save Changes
      </BaseButton>
    </template>
  </BaseModal>
</template>
