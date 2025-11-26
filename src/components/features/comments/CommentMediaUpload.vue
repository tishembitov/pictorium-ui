<!-- src/components/features/comments/CommentMediaUpload.vue -->
<script setup lang="ts">
/**
 * CommentMediaUpload - Загрузка медиа для комментариев
 * Гибрид: useFileUpload + validateMediaFile + стиль старого проекта
 */

import { computed, watch } from 'vue'
import { useFileUpload } from '@/composables/features/useFileUpload'
import { useToast } from '@/composables/ui/useToast'
import { validateMediaFile } from '@/utils/files'

export interface CommentMediaUploadProps {
  disabled?: boolean
  maxVideoDuration?: number
  accentColor?: string
}

const props = withDefaults(defineProps<CommentMediaUploadProps>(), {
  disabled: false,
  maxVideoDuration: 30,
  accentColor: '#000',
})

const emit = defineEmits<{
  (e: 'select', file: File): void
  (e: 'clear'): void
  (e: 'error', message: string): void
}>()

const { warning } = useToast()

const ACCEPT_STRING = '.jpg,.jpeg,.gif,.webp,.png,.bmp,.mp4,.webm'

// ✅ useFileUpload для preview и базовой логики
const {
  file,
  preview,
  isImageFile,
  isVideoFile,
  validationError,
  reset: resetUpload,
} = useFileUpload({
  accept: 'image/jpeg,image/png,image/gif,image/webp,image/bmp,video/mp4,video/webm',
})

const hasFile = computed(() => file.value !== null)

// ✅ validateMediaFile для валидации
async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const selectedFile = input.files?.[0]
  input.value = ''

  if (!selectedFile) return

  const validation = await validateMediaFile(selectedFile, {
    maxVideoDuration: props.maxVideoDuration,
  })

  if (!validation.valid) {
    const errorMessage = validation.errors[0] || 'Invalid file'
    warning(errorMessage)
    emit('error', errorMessage)
    return
  }

  // Создаём preview
  file.value = selectedFile
  emit('select', selectedFile)
}

function triggerUpload() {
  if (props.disabled) return

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = ACCEPT_STRING
  input.onchange = handleFileSelect
  input.click()
}

function clearFile() {
  resetUpload()
  emit('clear')
}

defineExpose({
  triggerUpload,
  clearFile,
  file,
  preview,
  isImageFile,
  isVideoFile,
  hasFile,
})
</script>

<template>
  <div class="relative">
    <!-- Trigger slot -->
    <slot name="trigger" :trigger="triggerUpload" :hasFile="hasFile">
      <button
        @click="triggerUpload"
        :disabled="disabled"
        type="button"
        class="p-1 transition transform hover:scale-105 disabled:opacity-50"
        aria-label="Upload media"
      >
        <i class="pi pi-images text-2xl cursor-pointer" :style="{ color: accentColor }" />
      </button>
    </slot>

    <!-- ✅ Preview в стиле старого проекта -->
    <div v-if="preview" class="relative mt-2">
      <div class="absolute top-0 left-[-10px] z-20" @click="clearFile">
        <i
          class="pi pi-times text-xs cursor-pointer p-2 text-white bg-black rounded-full hover:bg-gray-800 transition"
        />
      </div>

      <img
        v-if="isImageFile"
        :src="preview"
        alt="Media Preview"
        class="h-28 w-28 object-cover rounded-lg"
      />

      <video
        v-if="isVideoFile"
        :src="preview"
        class="h-32 w-32 object-cover rounded-lg"
        autoplay
        loop
        muted
      />
    </div>

    <p v-if="validationError" class="mt-1 text-xs text-red-500">
      {{ validationError }}
    </p>
  </div>
</template>
