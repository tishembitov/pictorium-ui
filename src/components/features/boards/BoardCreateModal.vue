<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useBoards } from '@/composables/api/useBoards'
import { useToast } from '@/composables/ui/useToast'
import { useForm } from '@/composables/form/useForm'
import { boardTitleValidator } from '@/composables/form/useFormValidation'
import type { Board } from '@/types'

export interface BoardCreateModalProps {
  modelValue: boolean
}

defineProps<BoardCreateModalProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created', board: Board): void
}>()

const { createBoard } = useBoards()
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

const handleSubmit = async () => {
  try {
    isSubmitting.value = true

    const isValid = await validateForm()
    if (!isValid) return

    const board = await createBoard(values.title)

    showToast('Board created successfully!', 'success')
    emit('created', board)
    emit('update:modelValue', false)

    reset()
  } catch (error) {
    console.error('[BoardCreateModal] Create failed:', error)
    showToast('Failed to create board', 'error')
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
    title="Create Board"
    size="sm"
  >
    <div class="space-y-4">
      <!-- Title Input -->
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

    <!-- Footer Actions -->
    <template #footer>
      <BaseButton variant="secondary" @click="handleCancel" :disabled="isSubmitting">
        Cancel
      </BaseButton>

      <BaseButton variant="primary" @click="handleSubmit" :loading="isSubmitting">
        Create
      </BaseButton>
    </template>
  </BaseModal>
</template>
