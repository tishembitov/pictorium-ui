<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { useFileUpload, useDragAndDrop } from '@/composables/features/useFileUpload'
import { formatFileSize } from '@/utils/formatters'

export interface FileUploadProps {
  modelValue: File | null
  accept?: string
  maxSize?: number
  minWidth?: number
  minHeight?: number
  maxVideoDuration?: number
  disabled?: boolean
  dragDrop?: boolean
  showPreview?: boolean
  previewWidth?: string
  previewHeight?: string
}

const props = withDefaults(defineProps<FileUploadProps>(), {
  accept: '.jpg,.jpeg,.gif,.webp,.png,.bmp,.mp4,.webm',
  maxSize: 50 * 1024 * 1024,
  minWidth: 200,
  minHeight: 300,
  maxVideoDuration: 30,
  disabled: false,
  dragDrop: true,
  showPreview: true,
  previewWidth: '271.84px',
  previewHeight: 'auto',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: File | null): void
  (e: 'error', errors: string[]): void
  (e: 'validated', file: File): void
}>()

// File upload composable
const {
  file,
  preview,
  validationError,
  isImageFile,
  isVideoFile,
  fileName,
  fileSize,
  selectFile,
  reset,
} = useFileUpload({
  accept: props.accept,
  maxSize: props.maxSize,
  onError: (err) => emit('error', [err.message]),
})

// Drag & drop
const dropZoneRef = ref<HTMLElement | null>(null)
const { isDragging } = useDragAndDrop(dropZoneRef, {
  accept: props.accept,
  onDrop: async (files) => {
    if (files[0]) {
      const success = await selectFile(files[0])
      if (success && file.value) {
        emit('update:modelValue', file.value)
        emit('validated', file.value)
      }
    }
  },
  onError: (error) => emit('error', [error]),
})

// File input ref
const fileInputRef = ref<HTMLInputElement | null>(null)

// Is GIF
const isGifFile = computed(() => {
  return file.value?.type === 'image/gif'
})

// File info
const fileInfo = computed(() => {
  if (!file.value) return null
  return {
    name: fileName.value,
    size: formatFileSize(fileSize.value),
  }
})

// Handle file select from input
const handleFileSelect = async (event: Event) => {
  const success = await selectFile(event)
  if (success && file.value) {
    emit('update:modelValue', file.value)
    emit('validated', file.value)
  }
}

// Trigger file input
const triggerFileInput = () => {
  if (!props.disabled) {
    fileInputRef.value?.click()
  }
}

// Remove file
const removeFile = () => {
  reset()
  emit('update:modelValue', null)
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}
</script>

<template>
  <div class="w-full">
    <!-- Drag & Drop Area -->
    <div
      v-if="dragDrop && !file"
      ref="dropZoneRef"
      @click="triggerFileInput"
      :class="[
        'border-2 border-dashed rounded-3xl transition-all duration-200 cursor-pointer',
        'flex flex-col items-center justify-center p-8 text-center',
        isDragging
          ? 'border-purple-500 bg-purple-100'
          : 'border-gray-400 hover:border-purple-500 hover:bg-purple-100',
        disabled && 'opacity-50 cursor-not-allowed',
      ]"
    >
      <svg
        class="w-12 h-12 text-gray-400 mb-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>

      <p class="text-xl text-black font-medium">
        {{ isDragging ? 'Drop file here' : 'Drag & Drop or Click to Upload' }}
      </p>

      <p class="mt-2 text-sm text-gray-700">
        Images must be at least {{ minWidth }}x{{ minHeight }} pixels
      </p>
      <p class="text-sm text-gray-700">Videos must be {{ maxVideoDuration }} seconds or less</p>
      <p class="mt-2 text-xs text-gray-700">{{ accept }}</p>
    </div>

    <!-- Click to Upload (no drag & drop) -->
    <div
      v-if="!dragDrop && !file"
      @click="triggerFileInput"
      :class="[
        'border-2 border-gray-300 rounded-3xl p-6 text-center cursor-pointer',
        'hover:bg-gray-50 transition',
        disabled && 'opacity-50 cursor-not-allowed',
      ]"
    >
      <p class="text-gray-600">Click to upload file</p>
      <p class="text-sm text-gray-500 mt-2">{{ accept }}</p>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      :disabled="disabled"
      @change="handleFileSelect"
      class="hidden"
    />

    <!-- Preview -->
    <div v-if="file && showPreview" class="mt-4 relative">
      <!-- Remove button -->
      <button
        @click="removeFile"
        class="absolute top-2 right-2 z-20 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-2 transition"
        type="button"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- GIF badge -->
      <div
        v-if="isGifFile"
        class="absolute top-2 left-2 bg-gray-200 text-black rounded-2xl px-3 py-1 text-sm z-10"
      >
        Gif
      </div>

      <!-- Image preview -->
      <img
        v-if="isImageFile && preview"
        :src="preview"
        alt="Preview"
        :style="{ width: previewWidth, height: previewHeight }"
        class="rounded-3xl object-cover mx-auto"
      />

      <!-- Video preview -->
      <video
        v-if="isVideoFile && preview"
        :src="preview"
        :style="{ width: previewWidth, height: previewHeight }"
        class="rounded-3xl object-cover mx-auto"
        autoplay
        loop
        muted
      ></video>

      <!-- File info -->
      <div v-if="fileInfo" class="mt-2 text-sm text-gray-600 text-center">
        <p class="truncate">{{ fileInfo.name }}</p>
        <p>{{ fileInfo.size }}</p>
      </div>
    </div>

    <!-- Error -->
    <p v-if="validationError" class="mt-2 text-sm text-red-500 text-center">
      {{ validationError }}
    </p>
  </div>
</template>
