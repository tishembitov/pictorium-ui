<script setup lang="ts">
import { ref, computed } from 'vue'
import { validateMediaFile, validateMediaFileSync } from '@/utils/files'
import { isImage, isVideo, isGif, createPreviewUrl } from '@/utils/media'
import { formatFileSize } from '@/utils/formatters'

export interface FileUploadProps {
  modelValue: File | null
  accept?: string
  maxSize?: number
  disabled?: boolean
  dragDrop?: boolean
  showPreview?: boolean
  validateAsync?: boolean
  previewWidth?: string
  previewHeight?: string
}

const props = withDefaults(defineProps<FileUploadProps>(), {
  accept: '.jpg,.jpeg,.gif,.webp,.png,.bmp,.mp4,.webm',
  maxSize: 50 * 1024 * 1024, // 50MB
  disabled: false,
  dragDrop: true,
  showPreview: true,
  validateAsync: true,
  previewWidth: '271.84px',
  previewHeight: 'auto',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: File | null): void
  (e: 'error', errors: string[]): void
  (e: 'validated', file: File): void
}>()

const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const isImagePreview = ref(false)
const isVideoPreview = ref(false)
const isGifPreview = ref(false)
const validating = ref(false)

const fileInfo = computed(() => {
  if (!props.modelValue) return null
  return {
    name: props.modelValue.name,
    size: formatFileSize(props.modelValue.size),
    type: props.modelValue.type,
  }
})

const handleFile = async (file: File) => {
  validating.value = true

  // Quick sync validation
  const syncResult = validateMediaFileSync(file)
  if (!syncResult.valid) {
    emit('error', syncResult.errors)
    validating.value = false
    return
  }

  // Async validation if needed
  if (props.validateAsync) {
    const asyncResult = await validateMediaFile(file)
    if (!asyncResult.valid) {
      emit('error', asyncResult.errors)
      validating.value = false
      return
    }
  }

  // Create preview
  if (props.showPreview) {
    previewUrl.value = createPreviewUrl(file)
    isImagePreview.value = isImage(file)
    isVideoPreview.value = isVideo(file)
    isGifPreview.value = isGif(file)
  }

  emit('update:modelValue', file)
  emit('validated', file)
  validating.value = false
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await handleFile(file)
  }
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    await handleFile(file)
  }
}

const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const removeFile = () => {
  emit('update:modelValue', null)
  previewUrl.value = null
  isImagePreview.value = false
  isVideoPreview.value = false
  isGifPreview.value = false
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}
</script>

<template>
  <div class="w-full">
    <!-- Drag & Drop Area -->
    <div
      v-if="dragDrop && !modelValue"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
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

      <p class="mt-2 text-sm text-gray-700">Images must be at least 200x300 pixels</p>
      <p class="text-sm text-gray-700">Videos must be 30 seconds or less</p>
      <p class="mt-2 text-xs text-gray-700">
        {{ accept }}
      </p>
    </div>

    <!-- Click to Upload (no drag & drop) -->
    <div
      v-if="!dragDrop && !modelValue"
      @click="triggerFileInput"
      class="border-2 border-gray-300 rounded-3xl p-6 text-center cursor-pointer hover:bg-gray-50 transition"
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
    <div v-if="modelValue && showPreview" class="mt-4 relative">
      <!-- Loading overlay -->
      <div
        v-if="validating"
        class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10"
      >
        <span class="loader2"></span>
      </div>

      <!-- Remove button -->
      <button
        @click="removeFile"
        class="absolute top-2 right-2 z-20 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-2 transition"
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
        v-if="isGifPreview"
        class="absolute top-2 left-2 bg-gray-200 text-black rounded-2xl px-3 py-1 text-sm z-10"
      >
        Gif
      </div>

      <!-- Image preview -->
      <img
        v-if="isImagePreview && previewUrl"
        :src="previewUrl"
        alt="Preview"
        :style="{ width: previewWidth, height: previewHeight }"
        class="rounded-lg object-cover"
      />

      <!-- Video preview -->
      <video
        v-if="isVideoPreview && previewUrl"
        :src="previewUrl"
        :style="{ width: previewWidth, height: previewHeight }"
        class="rounded-lg object-cover"
        autoplay
        loop
        muted
      ></video>

      <!-- File info -->
      <div v-if="fileInfo" class="mt-2 text-sm text-gray-600">
        <p class="truncate">{{ fileInfo.name }}</p>
        <p>{{ fileInfo.size }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loader2 {
  width: 48px;
  height: 48px;
  background: #fff;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

.loader2::after {
  content: '';
  box-sizing: border-box;
  position: absolute;
  left: 6px;
  top: 10px;
  width: 12px;
  height: 12px;
  color: #ff3d00;
  background: currentColor;
  border-radius: 50%;
  box-shadow:
    25px 2px,
    10px 22px;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
