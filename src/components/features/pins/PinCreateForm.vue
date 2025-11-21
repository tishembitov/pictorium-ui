<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FileUpload from '@/components/ui/FileUpload.vue'
import TagInput from '@/components/features/tag/TagInput.vue'
import { useForm } from '@/composables/form/useForm'
import { usePins } from '@/composables/api/usePins'
import { useToast } from '@/composables/ui/useToast'
import { useRouter } from 'vue-router'
import { extractDominantColor } from '@/utils/colors'
import { getImageDimensions } from '@/utils/media'
import type { PinCreateRequest } from '@/types'

const emit = defineEmits<{
  (e: 'success', pin: Pin): void
  (e: 'cancel'): void
}>()

const router = useRouter()
const { createPin } = usePins()
const { showToast } = useToast()

// Form state
const mediaFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const isSubmitting = ref(false)

const { values, errors, isValid, setFieldValue, setFieldError, validateForm } = useForm({
  initialValues: {
    title: '',
    description: '',
    href: '',
    tags: [] as string[],
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

const canSubmit = computed(() => {
  return mediaFile.value !== null && !isSubmitting.value
})

const handleMediaChange = (file: File | null) => {
  mediaFile.value = file
  if (file) {
    previewUrl.value = URL.createObjectURL(file)
  } else {
    previewUrl.value = null
  }
}

const handleMediaError = (errors: string[]) => {
  showToast(errors[0] || 'Invalid file', 'error')
}

const handleTagsChange = (tags: string[]) => {
  setFieldValue('tags', tags)
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  try {
    isSubmitting.value = true

    // Validate form
    const isFormValid = await validateForm()
    if (!isFormValid) {
      showToast('Please fix validation errors', 'error')
      return
    }

    // Extract color and dimensions
    let rgb: string | undefined
    let width: number | undefined
    let height: number | undefined

    if (previewUrl.value) {
      try {
        rgb = await extractDominantColor(previewUrl.value)
      } catch (error) {
        console.warn('Failed to extract color:', error)
      }

      try {
        const dimensions = await getImageDimensions(mediaFile.value!)
        width = dimensions.width
        height = dimensions.height
      } catch (error) {
        console.warn('Failed to get dimensions:', error)
      }
    }

    // Create pin
    const pin = await createPin({
      file: mediaFile.value!,
      title: values.title || undefined,
      description: values.description || undefined,
      href: values.href || undefined,
      tags: values.tags,
      rgb,
    })

    showToast('Pin created successfully!', 'success')
    emit('success', pin)

    // Redirect to pin detail
    router.push(`/pin/${pin.id}`)
  } catch (error) {
    console.error('[PinCreateForm] Submit failed:', error)
    showToast('Failed to create pin', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
  router.back()
}

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Create Pin</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Left: Media Upload -->
      <div>
        <FileUpload
          v-model="mediaFile"
          :validate-async="true"
          :drag-drop="true"
          :show-preview="true"
          @error="handleMediaError"
          class="mb-4"
        />
      </div>

      <!-- Right: Form Fields -->
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

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-4">
          <BaseButton variant="secondary" @click="handleCancel" :disabled="isSubmitting">
            Cancel
          </BaseButton>

          <BaseButton
            variant="primary"
            @click="handleSubmit"
            :loading="isSubmitting"
            :disabled="!canSubmit"
            full-width
          >
            Create Pin
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
