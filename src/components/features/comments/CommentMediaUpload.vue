<script setup lang="ts">
import { ref, computed } from 'vue'
import FileUpload from '@/components/ui/FileUpload.vue'

export interface CommentMediaUploadProps {
  modelValue: File | null
  disabled?: boolean
}

const props = withDefaults(defineProps<CommentMediaUploadProps>(), {
  modelValue: null,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: File | null): void
  (e: 'error', errors: string[]): void
}>()

const handleError = (errors: string[]) => {
  emit('error', errors)
}
</script>

<template>
  <div class="relative">
    <FileUpload
      :modelValue="modelValue"
      @update:modelValue="emit('update:modelValue', $event)"
      @error="handleError"
      accept=".jpg,.jpeg,.gif,.webp,.png,.bmp,.mp4,.webm"
      :maxSize="50 * 1024 * 1024"
      :disabled="disabled"
      :dragDrop="false"
      :showPreview="true"
      :validateAsync="true"
      previewWidth="128px"
      previewHeight="128px"
    />
  </div>
</template>
