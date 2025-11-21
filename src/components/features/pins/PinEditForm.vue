<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import TagInput from '@/components/features/tag/TagInput.vue'
import PinMedia from './PinMedia.vue'
import { useForm } from '@/composables/form/useForm'
import { usePins } from '@/composables/api/usePins'
import { useToast } from '@/composables/ui/useToast'
import type { Pin } from '@/types'

export interface PinEditFormProps {
  modelValue: boolean
  pin: Pin
}

const props = defineProps<PinEditFormProps>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success', pin: Pin): void
}>()

const { updatePin } = usePins()
const { showToast } = useToast()

const isSubmitting = ref(false)

const { values, errors, isValid, setFieldValue, validateForm, reset } = useForm({
  initialValues: {
    title: props.pin.title || '',
    description: props.pin.description || '',
    href: props.pin.href || '',
    tags: props.pin.tags || [],
  },
  validationRules: {
    title: [
      (value: string) => {
        if (value && value.length > 200) {
          return 'Title must be at most 200 characters'
        }
        return null
      },
    ],
    description: [
      (value: string) => {
        if (value && value.length > 400) {
          return 'Description must be at most 400 characters'
        }
        return null
      },
    ],
  },
})

// Load initial data
onMounted(() => {
  reset()
})

const handleTagsChange = (tags: string[]) => {
  setFieldValue('tags', tags)
}

const handleSubmit = async () => {
  try {
    isSubmitting.value = true

    const isFormValid = await validateForm()
    if (!isFormValid) {
      showToast('Please fix validation errors', 'error')
      return
    }

    const updated = await updatePin(props.pin.id, {
      title: values.title || undefined,
      description: values.description || undefined,
      href: values.href || undefined,
      tags: values.tags,
    })

    showToast('Pin updated successfully!', 'success')
    emit('success', updated)
    emit('update:modelValue', false)
  } catch (error) {
    console.error('[PinEditForm] Submit failed:', error)
    showToast('Failed to update pin', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Edit Pin"
    size="lg"
    :closable="!isSubmitting"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Left: Preview -->
      <div>
        <PinMedia :pin="pin" :auto-play="false" :show-controls="false" />
      </div>

      <!-- Right: Form -->
      <div class="space-y-4">
        <!-- Title -->
        <BaseInput
          v-model="values.title"
          label="Title"
          placeholder="Add a title"
          :error="errors.title"
          :max-length="200"
        />

        <!-- Description -->
        <BaseTextarea
          v-model="values.description"
          label="Description"
          placeholder="Tell everyone what your pin is about"
          :error="errors.description"
          :max-length="400"
          :rows="4"
        />

        <!-- Link -->
        <BaseInput
          v-model="values.href"
          label="Link (optional)"
          placeholder="Add a destination link"
          type="url"
          :error="errors.href"
        />

        <!-- Tags -->
        <TagInput
          :model-value="values.tags"
          @update:model-value="handleTagsChange"
          label="Tags"
          placeholder="Add tags"
          :max-tags="10"
        />
      </div>
    </div>

    <!-- Footer Actions -->
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
